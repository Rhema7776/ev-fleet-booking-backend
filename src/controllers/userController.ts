import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import userService from "../services/userService";
import type { ListUsersQuery, UserIdParam } from "../validators/userValidator";

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.list(req.validatedQuery as ListUsersQuery);
  return sendSuccess(res, 200, "Users retrieved successfully.", result);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as UserIdParam;
  const user = await userService.getById(id);
  return sendSuccess(res, 200, "User retrieved successfully.", user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as UserIdParam;
  const user = await userService.update(id, req.user!.id, req.user!.role, req.body);
  return sendSuccess(res, 200, "User updated successfully.", user);
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as UserIdParam;
  const user = await userService.deactivate(id);
  return sendSuccess(res, 200, "User deactivated successfully.", user);
});
