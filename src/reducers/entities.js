import { combineReducers } from "redux";
import usersReducer from "./users";
import productsReducer from "./products";
import reviewsReducer from "./reviews";
import categoriesReducer from "./categories";
import { getAllItems, getItemById } from "./normalizedSelectors";

export const getProductById = ({ products }, id) => getItemById(products, id);

export const getListOfProductsById = ({ products }, ids) => {
  const isIdsListEmpty = Array.isArray(ids) && !ids.length;

  if (isIdsListEmpty || !ids) {
    return [];
  }

  const items = getAllItems(products);

  return items.filter(({ id }) => ids.includes(id));
};

export const getAllProducts = ({ products }) => getAllItems(products);

export const getUserById = ({ users }, id) => getItemById(users, id);
export const getAllUsers = ({ users }) => getAllItems(users);

export const getAllCategories = ({ categories }) => categories;

export const getListOfReviewsById = ({ reviews }, ids) => {
  const isIdsListEmpty = Array.isArray(ids) && !ids.length;

  if (isIdsListEmpty || !ids) {
    return [];
  }

  const items = getAllItems(reviews);

  return items.filter(({ id }) => ids.includes(id));
};

export default combineReducers({
  products: productsReducer,
  reviews: reviewsReducer,
  users: usersReducer,
  categories: categoriesReducer
});
