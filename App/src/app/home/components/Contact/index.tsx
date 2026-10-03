"use client";

import React, { useState } from "react";
import apiClient from "@apiClient";
import {
  CREATE_CONTACT,
} from "@api";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    email: "",
    mobile: "",
    projectType: "",
    budget: "",
  });



  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      message: "",
      email: "",
      mobile: "",
      projectType: "",
      budget: "",
    });
  };

  const submitFormData = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(formData).some((value) => !value.trim())) {
      toast.error("Please complete all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(CREATE_CONTACT, formData);
      if (response.status === 201) {
        toast.success("Thanks! Your message was sent successfully.");
        resetForm();
      }
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      toast.error(apiError.response?.data?.message || "Failed to submit form.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
      <div className="p-4 mx-auto w-[90%] lg:w-[60%]" id="contact-us-section">
        {/* Heading Section */}
        <div className="text-center pt-3" data-aos="fade-down" >
          <p className="text-purple-500 text-xl font-semibold">Get in Touch</p>
          <h1 className="mt-2 text-4xl font-bold">
            Any Questions? Feel Free to Contact
          </h1>
        </div>

        {/* Form Section */}
        <div className="flex flex-col md:flex-row w-full mx-auto mt-5 space-y-8 md:space-y-0 md:space-x-8">
          <section className="w-full p-6">
            <form
              data-aos="fade-left"
              className="flex flex-col space-y-6"
              onSubmit={submitFormData}
            >
              <div className="grid grid-cols-1 gap-6 sm:p-6 rounded-md shadow-sm">
                {/* Name Field */}
                <input
                  required
                  type="text"
                  id="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded bg-transparent outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Name"
                />

                {/* Email Field */}
                <input
                  required
                  type="email"
                  id="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded bg-transparent outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Email"
                />

                <input
                  required
                  type="text"
                  id="projectType"
                  placeholder="Project type"
                  value={formData.projectType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded bg-transparent outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Project type"
                />

                <input
                  required
                  type="text"
                  id="budget"
                  placeholder="Budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded bg-transparent outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Budget"
                />

                {/* Phone Field */}
                <input
                  required
                  type="tel"
                  id="mobile"
                  placeholder="Mobile No."
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded bg-transparent outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Mobile Number"
                />



                {/* Message Field */}
                <textarea
                  required
                  rows={6}
                  id="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded bg-transparent outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  aria-label="Message"
                ></textarea>

                {/* Submit Button */}
                <div className="flex justify-start">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#fca61f] text-white p-3 px-6 text-xl rounded-full border-0 cursor-pointer hover:bg-purple-700 transition-all duration-500"
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
  );
};

export default Contact;
