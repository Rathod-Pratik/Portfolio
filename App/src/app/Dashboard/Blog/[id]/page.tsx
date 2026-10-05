"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import dynamic from "next/dynamic";
import * as yup from "yup";
import { useFormik } from "formik";
import { CREATE_BLOG, DELETE_BLOG, GET_BLOG_DETAILS, UPDATE_BLOG } from "@api";
import apiClient from "@apiClient";
import { Button, Input, Loading } from "@components";

const MarkdownEditor = dynamic(
	() => import("@uiw/react-markdown-editor"),
	{
		ssr: false,
		loading: () => (
			<div className="h-112.5 flex items-center justify-center bg-gray-700/50 rounded-lg text-gray-400">
				Loading Markdown Editor...
			</div>
		),
	}
);

export type BlogType = {
	_id: string;
	title: string;
	slug: string;
	excerpt?: string;
	tags: string[];
	content?: string;
	isPublished?: boolean;
	coverImage?: string;
	image?: string;
	createdAt?: string;
	updatedAt?: string;
};

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

const validationSchema = yup.object().shape({
	title: yup
		.string()
		.trim()
		.min(1, "Title is required")
		.max(150, "Title must not exceed 150 characters")
		.required("Title is required"),
	slug: yup
		.string()
		.trim()
		.matches(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Slug must contain only lowercase letters, numbers, and hyphens (e.g., my-blog-post)"
		)
		.max(100, "Slug must not exceed 100 characters")
		.required("Slug is required"),
	excerpt: yup
		.string()
		.trim()
		.min(1, "Excerpt is required")
		.max(300, "Excerpt must not exceed 300 characters")
		.required("Excerpt is required"),
	content: yup
		.string()
		.trim()
		.min(1, "Content is required")
		.required("Content is required"),
	tags: yup
		.array()
		.of(yup.string())
		.min(1, "At least one tag is required")
		.required("Tags are required"),
	image: yup
		.mixed<File>()
		.test("imageRequired", "Cover image is required", function (value) {
			if (value instanceof File) return true;
			if (this.parent.image) return true;
			return false;
		})
		.test(
			"fileType",
			"Only JPG, JPEG, PNG, and WEBP images are allowed",
			(value) => {
				if (!value || !(value instanceof File)) return true;
				return [
					"image/jpeg",
					"image/jpg",
					"image/png",
					"image/webp",
				].includes(value.type);
			}
		)
		.test(
			"fileSize",
			"Image size must be less than 5 MB",
			(value) => {
				if (!value || !(value instanceof File)) return true;
				return value.size <= 5 * 1024 * 1024;
			}
		),
	isPublished: yup.boolean(),
});

const CreateBlog = ({ params }: PageProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const resolvedParams = use(params);
	const rawId = resolvedParams?.id;
	const isEdit = Boolean(rawId && rawId !== "create" && rawId !== "new");
	const id = isEdit ? rawId : null;

	const [isDeleting, setIsDeleting] = useState(false);

	const {
		data: blog,
		isLoading: isBlogLoading,
		isError: isBlogError,
	} = useQuery<BlogType>({
		queryKey: ["admin-blog", id],
		enabled: Boolean(isEdit && id),
		queryFn: async () => {
			const response = await apiClient.get(`${GET_BLOG_DETAILS}/${id}`, {
				withCredentials: true,
			});
			const blogData = response.data?.data ?? response.data?.blog ?? response.data;
			if (!blogData) {
				throw new Error("Blog not found");
			}
			return blogData;
		},
	});

	const generateSlug = (text: string) => {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	};

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			title: blog?.title || "",
			slug: blog?.slug || "",
			excerpt: blog?.excerpt || "",
			content: blog?.content || "",
			isPublished: Boolean(blog?.isPublished),
			tags: (blog?.tags || []) as string[],
			image: undefined as File | undefined,
			coverImage: blog?.coverImage || "",
		},
		validationSchema,
		onSubmit: async (values, { setSubmitting }) => {
			try {
				const formData = new FormData();
				const tags = values.tags
					.map((tag) => tag.trim())
					.filter(Boolean);

				formData.append("title", values.title.trim());
				formData.append("slug", values.slug.trim());
				formData.append("excerpt", values.excerpt.trim());
				formData.append("content", values.content);
				formData.append("isPublished", String(values.isPublished));

				tags.forEach((tag) => {
					formData.append("tags", tag);
				});

				if (values.image instanceof File) {
					formData.append("file", values.image);
				}

				if (isEdit && id) {
					const response = await apiClient.put(
						`${UPDATE_BLOG}/${id}`,
						formData,
						{
							withCredentials: true,
						}
					);

					if (response.status === 200 || response.status === 202) {
						toast.success("Blog updated successfully");
						queryClient.invalidateQueries({ queryKey: ["blogs"] });
						queryClient.invalidateQueries({ queryKey: ["admin-blog", id] });
						router.push("/Dashboard/Blog");
					}
				} else {
					const response = await apiClient.post(
						CREATE_BLOG,
						formData,
						{
							withCredentials: true,
						}
					);

					if (response.status === 201 || response.status === 200) {
						toast.success("Blog created successfully");
						queryClient.invalidateQueries({ queryKey: ["blogs"] });
						router.push("/Dashboard/Blog");
					}
				}
			} catch (error) {
				const apiError = error as AxiosError<{
					message?: string;
					error?: string | Array<{ message?: string }>;
				}>;

				if (apiError.response?.status === 403) {
					toast.error("Access denied. Please login as admin.");
					router.push("/login");
					return;
				}

				const validationError = Array.isArray(apiError.response?.data?.error)
					? apiError.response.data.error[0]?.message
					: apiError.response?.data?.error;
				const errorMessage =
					apiError.response?.data?.message ||
					validationError ||
					(isEdit ? "Failed to update blog" : "Failed to create blog");

				toast.error(errorMessage);
				console.error(apiError);
			} finally {
				setSubmitting(false);
			}
		},
	});

	const handleDelete = async () => {
		if (!id || !isEdit) {
			return;
		}

		const shouldDelete = window.confirm(
			"Are you sure you want to delete this blog? This action cannot be undone."
		);
		if (!shouldDelete) {
			return;
		}

		try {
			setIsDeleting(true);
			const response = await apiClient.delete(`${DELETE_BLOG}/${id}`, {
				withCredentials: true,
			});
			if (response.status === 200) {
				toast.success("Blog deleted successfully");
				queryClient.invalidateQueries({ queryKey: ["blogs"] });
				router.push("/Dashboard/Blog");
			}
		} catch (error) {
			const apiError = error as AxiosError<{
				message?: string;
				error?: string | Array<{ message?: string }>;
			}>;
			if (apiError.response?.status === 403) {
				toast.error("Access denied. Please login as admin.");
				router.push("/login");
				return;
			}

			const validationError = Array.isArray(apiError.response?.data?.error)
				? apiError.response.data.error[0]?.message
				: apiError.response?.data?.error;
			toast.error(
				apiError.response?.data?.message ||
				validationError ||
				"Failed to delete blog"
			);
			console.error(apiError);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const errors = await formik.validateForm();
		if (Object.keys(errors).length > 0) {
			formik.setTouched({
				title: true,
				slug: true,
				excerpt: true,
				image: true,
				tags: true,
				content: true,
				isPublished: true,
			});
			const firstError = Object.values(errors)[0];
			if (typeof firstError === "string") {
				toast.error(firstError);
			} else if (Array.isArray(firstError)) {
				toast.error(firstError[0]);
			}
			return;
		}
		formik.handleSubmit();
	};

	if (isEdit && isBlogLoading) {
		return (
			<div className="flex justify-center items-center h-[70vh]">
				<Loading />
			</div>
		);
	}

	if (isEdit && isBlogError) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh] gap-4">
				<p className="text-red-400 text-lg">Failed to load blog details</p>
				<Button
					varient="secondary"
					text="Back to Blogs"
					onClick={() => router.push("/Dashboard/Blog")}
					title="Back to Blogs"
				/>
			</div>
		);
	}

	const tagsError =
		formik.touched.tags && formik.errors.tags
			? typeof formik.errors.tags === "string"
				? formik.errors.tags
				: (formik.errors.tags as string[])[0]
			: undefined;

	return (
		<form onSubmit={handleFormSubmit} >
			{/* Top Header */}
			<div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-700">
				<div>
					<h2 className="text-2xl font-bold text-white">
						{isEdit ? "Update Blog" : "Create Blog"}
					</h2>
					<p className="text-xs text-gray-400 mt-1">
						{isEdit ? "Edit and publish updates to your blog post" : "Write and publish a new blog post"}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						varient="secondary"
						text="Back"
						onClick={() => router.push("/Dashboard/Blog")}
						title="Back to Blogs"
					/>
				</div>
			</div>

			{/* Cover Image Upload Section */}
			<div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-4 sm:p-5 shadow-lg">
				<Input
					name="image"
					lable="Cover Image"
					inputType="Image"
					imagePreview={formik.values.coverImage || blog?.image || ""}
					handleImageChange={(file) => {
						formik.setFieldValue("image", file ?? undefined);
						formik.setFieldTouched("image", true);
					}}
					error={
						formik.touched.image && formik.errors.image
							? (formik.errors.image as string)
							: undefined
					}
				/>
			</div>

			{/* Form Fields Section */}
			<div className="grid gap-5">
				{/* Title Field */}
				<div>
					<Input
						type="text"
						name="title"
						lable="Title"
						value={formik.values.title}
						inputType="input"
						onChange={(value) => {
							formik.setFieldValue("title", value);
							if (!isEdit) {
								formik.setFieldValue("slug", generateSlug(value));
							}
						}}
						onBlur={() => formik.setFieldTouched("title", true)}
						placeholder="e.g. Master Modern Full-Stack Web Development in 2026"
						error={
							formik.touched.title && formik.errors.title
								? (formik.errors.title as string)
								: undefined
						}
					/>
				</div>

				{/* Slug Field */}
				<div>
					<Input
						type="text"
						name="slug"
						lable="Slug (URL identifier)"
						value={formik.values.slug}
						inputType="input"
						onChange={(value) => formik.setFieldValue("slug", value)}
						onBlur={() => formik.setFieldTouched("slug", true)}
						placeholder="e.g. master-modern-fullstack-web-development"
						error={
							formik.touched.slug && formik.errors.slug
								? (formik.errors.slug as string)
								: undefined
						}
					/>
				</div>

				{/* Excerpt Field */}
				<div>
					<Input
						name="excerpt"
						lable="Excerpt"
						value={formik.values.excerpt}
						inputType="textarea"
						onChange={(value) => formik.setFieldValue("excerpt", value)}
						onBlur={() => formik.setFieldTouched("excerpt", true)}
						placeholder="Brief summary of what this blog post covers..."
						error={
							formik.touched.excerpt && formik.errors.excerpt
								? (formik.errors.excerpt as string)
								: undefined
						}
					/>
					<div className="flex justify-end mt-1">
						<span className="text-xs text-gray-400">
							{formik.values.excerpt.length}/300 characters
						</span>
					</div>
				</div>

				{/* Markdown Content Editor */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="block text-sm font-medium text-gray-300">
							Content (Markdown Supported)
						</label>
						<span className="text-xs text-gray-400">
							{formik.values.content.length} characters
						</span>
					</div>

					<div
						data-color-mode="dark"
						className={`min-h-120 rounded-lg overflow-hidden border ${formik.touched.content && formik.errors.content
								? "border-red-500"
								: "border-gray-600"
							}`}
					>
						<MarkdownEditor
							value={formik.values.content}
							onChange={(val) => formik.setFieldValue("content", val || "")}
							height="500px"
							enableScroll={true}
						/>
					</div>

					{formik.touched.content && formik.errors.content && (
						<p className="text-red-500 text-xs mt-1">
							{formik.errors.content as string}
						</p>
					)}
				</div>

				{/* Tags Field */}
				<div>
					<Input
						type="text"
						name="tags"
						lable="Tags (comma separated)"
						value={formik.values.tags.join(", ")}
						inputType="input"
						onChange={(value) => {
							const parsed = value
								.split(",")
								.map((tag) => tag.trim())
								.filter(Boolean);
							formik.setFieldValue("tags", parsed);
						}}
						onBlur={() => {
							formik.setFieldTouched("tags", true);
							const parsed = formik.values.tags.join(", ")
								.split(",")
								.map((tag) => tag.trim())
								.filter(Boolean);
							formik.setFieldValue("tags", parsed);
						}}
						placeholder="e.g. Next.js, React, TypeScript, FullStack"
						error={tagsError}
					/>

					{/* Tag Badges Preview */}
					{formik.values.tags.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-2">
							{formik.values.tags.map((tag, idx) => (
								<span
									key={idx}
									className="bg-purple-600/20 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5"
								>
									#{tag}
									<button
										type="button"
										onClick={() => {
											const remaining = formik.values.tags.filter((t) => t !== tag);
											formik.setFieldValue("tags", remaining);
										}}
										className="hover:text-red-400 font-bold text-sm leading-none ml-0.5"
										title={`Remove ${tag}`}
									>
										&times;
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				{/* Publish Checkbox */}
				<div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/60 border border-gray-700">
					<input
						id="isPublished"
						type="checkbox"
						checked={formik.values.isPublished}
						onChange={(e) => formik.setFieldValue("isPublished", e.target.checked)}
						className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
					/>
					<label htmlFor="isPublished" className="text-sm font-medium text-white cursor-pointer select-none">
						Publish now
						<span className="block text-xs font-normal text-gray-400">
							If checked, this blog post will immediately appear publicly on your portfolio blog page.
						</span>
					</label>
				</div>
			</div>

			{/* Form Footer Action Buttons */}
			<div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">

				{isEdit && (
					<Button
						type="button"
						varient="danger"
						text="Delete"
						onClick={handleDelete}
						title="Delete Blog"
						isSubmitting={isDeleting}
						ProcessText="Deleting..."
					/>
				)}

				<Button
					type="submit"
					varient="primary"
					text={isEdit ? "Update Blog" : "Create Blog"}
					title={isEdit ? "Update Blog" : "Create Blog"}
					isSubmitting={formik.isSubmitting}
					ProcessText="Saving..."
				/>
			</div>
		</form>
	);
};

export default CreateBlog;
