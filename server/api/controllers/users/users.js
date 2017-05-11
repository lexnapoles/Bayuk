import {sendJsonResponse} from "../../../../utils/utils";
import {validateRequest, validateId} from "../validators";
import {validateTokenWithUser} from "./validators";
import {getUsers, getUserById, updateEmail} from "../../services/users";
import {createJwt} from "../../services/authentication";
import {has} from "lodash/object";

export const readUsers = (req, res) =>
	getUsers()
		.then(users => sendJsonResponse(res, 200, users))
		.catch(error => sendJsonResponse(res, 404, {"message": error}));

export const readOneUser = (req, res) => {

	if (!has(req, "params") && !has(req.params, "userId")) {
		sendJsonResponse(res, 404, {
			"message": "No userId in request"
		});
		return;
	}

	const {userId} = req.params;

	getUserById(userId)
		.then(user => sendJsonResponse(res, 200, user))
		.catch(error => sendJsonResponse(res, 404, {"message": error}));
};

export const updateUserEmail = (req, res) => {
	const requestErrors = [
		...validateRequest(req, ["body", "params"]),
		...validateRequest(req.params, "userId"),
	];

	if (requestErrors.length) {
		sendJsonResponse(res, 400, requestErrors);
		return;
	}

	const {userId} = req.params,
				{email}  = req.body;

	const noEmailError = validateRequest(req.body, "email");

	if (noEmailError.length) {
		sendJsonResponse(res, 400, noEmailError);
		return
	}

	const invalidIdError = validateId(userId);

	if (invalidIdError.length) {
		sendJsonResponse(res, 400, invalidIdError);
		return;
	}

	const invalidTokenError = validateTokenWithUser(req.user, req.params);

	if (invalidTokenError.length) {
		sendJsonResponse(res, 403, invalidTokenError);
		return;
	}

	updateEmail(userId, email)
		.then(user => sendJsonResponse(res, 200, createJwt(user)));
};

export const updateOneUser = (req, res) => {
	return;
};

export const createUserImage = (req, res) => {
	return;
};

export const deleteOneUser = (req, res) => {
	return;
};

