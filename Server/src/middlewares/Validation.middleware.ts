import type { Request, Response, NextFunction } from "express";
import { z } from "zod";


export const Validate = (Schema: z.ZodType) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const result = Schema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues
            })

            return;
        }

        req.body = result.data;
        next();
    }
}