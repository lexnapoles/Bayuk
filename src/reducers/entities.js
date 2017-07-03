import {combineReducers} from "redux";
import users from "./users";
import products from "./products"
import categories from "./categories";
import {getCategories} from "./categories";
import {getAllItems, getItemById} from "./normalizedSelectors";

export const getProductById = ({products}, id) => getItemById(products, id);
export const getAllProducts = ({products}) => getAllItems(products);

export const getUserById = ({users}, id) => getItemById(users, id);
export const getAllUsers = ({users}) => getAllItems(users);

export const getAllCategories = ({categories}) => getCategories(categories);

export default combineReducers({
	products,
	users,
	categories
});