import type { Request, Response } from "express";

export function getHealthStatus(_request: Request, response: Response): void {
  response.status(200).json({
    success: true,
    message: "PulseHR API is running",
  });
}
