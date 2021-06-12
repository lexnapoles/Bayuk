import { has } from "lodash/object";
import { getProductById } from "../api/services/products";
import { sendJsonResponse } from "../utils";
import { productDoesNotExist } from "../errors/api/productErrors";
import { validateRequest } from "../api/controllers/validators";
import {
  unauthorizedAccess,
  tokenDoesNotMatch
} from "../errors/api/authorizationErrors";
import dbErrors from "../errors/database";

export default async function verifyProduct(req, res, next) {
  if (!has(req, "user")) {
    sendJsonResponse(res, 401, [unauthorizedAccess()]);
    return;
  }

  const requestErrors = [
    ...validateRequest(req, "params"),
    ...validateRequest(req.params, "productId")
  ];

  if (requestErrors.length) {
    sendJsonResponse(res, 400, [requestErrors]);
    return;
  }

  const tokenUserId = req.user.id;
  const productId = req.params.productId;

  try {
    const { owner } = await getProductById(productId);

    if (owner !== tokenUserId) {
      sendJsonResponse(res, 403, [tokenDoesNotMatch()]);
      return;
    }

    next();
  } catch (error) {
    if (error.code === dbErrors.dataNotFound) {
      sendJsonResponse(res, 404, [productDoesNotExist()]);
      return;
    }

    sendJsonResponse(res, 500, [error]);
  }
}
