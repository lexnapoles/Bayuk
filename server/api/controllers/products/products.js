import {has} from "lodash/object";
import {sendJsonResponse} from "../../../../utils/utils";
import {getProducts, getProductById, addProduct, updateProduct, deleteProduct} from "../../services/products";
import {transformProduct} from "../../transformers/products";
import {notFoundError}  from "../../../errors/api/productErrors";
import {invalidId}  from "../../../errors/api/controllerErrors";
import {validateRequest} from "../validators";
import {validateProductBody} from "./validators"
import validateUUID from "uuid-validate";

export const readProducts = (req, res) =>
	getProducts()
		.then(products => products.map(transformProduct))
		.then(products => sendJsonResponse(res, 200, products))
		.catch(error => sendJsonResponse(res, 404, {
			message: error
		}));

export const readOneProduct = (req, res) => {
	const requestErrors = validateRequest(req, "params");

	if (requestErrors.length) {
		sendJsonResponse(res, 400, requestErrors);
		return;
	}

	const {productId} = req.params;

	getProductById(productId)
		.then(transformProduct)
		.then(product => sendJsonResponse(res, 200, product))
		.catch(() => sendJsonResponse(res, 404, [notFoundError()]));
};

export const createProduct = (req, res) => {
	const requestErrors = validateRequest(req, "body");

	if (requestErrors.length) {
		sendJsonResponse(res, 400, requestErrors);
		return;
	}

	const productFields     = ["name", "description", "images", "category", "price"],
				productBodyErrors = validateProductBody(req.body, productFields);

	if (productBodyErrors.length) {
		sendJsonResponse(res, 400, productBodyErrors);
		return;
	}

	const product = {
		...req.body,
		owner: req.user.id
	};

	addProduct(product)
		.then(transformProduct)
		.then(product => {
			res.location(`/api/products/${product.id}`);
			sendJsonResponse(res, 201, product)
		})
		.catch(error => sendJsonResponse(res, 404, error));
};

export const updateOneProduct = (req, res) => {
	const requestErrors = [
		...validateRequest(req, "body"),
		...validateRequest(req, "params"),
		...validateRequest(req.params, "productId"),
	];

	if (requestErrors.length) {
		sendJsonResponse(res, 400, requestErrors);
		return;
	}

	const productId = req.params.productId;

	if (!validateUUID(productId)) {
		sendJsonResponse(res, 400, [invalidId()]);
		return;
	}

	const product = req.body;

	return updateProduct(product)
		.then(transformProduct)
		.then(product => sendJsonResponse(res, 200, product))
		.catch(error => sendJsonResponse(res, 404, error));
};

export const deleteOneProduct = (req, res) => {
	if (!has(req, "params") && !has(req.params, "productId")) {
		sendJsonResponse(res, 404, {
			message: "No productId in request"
		});

		return;
	}

	const {productId} = req.params;

	return deleteProduct(productId)
		.then(() => sendJsonResponse(res, 204, null))
		.catch(error => sendJsonResponse(res, 404, {
			message: error
		}));
};

export const addProductImages = (req, res) => {
	return;
};