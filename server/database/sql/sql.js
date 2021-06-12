import { QueryFile } from "pg-promise";
import path from "path";

function sql(file) {
  const fullPath = path.join(__dirname, file);

  return new QueryFile(fullPath, { minify: true });
}

export const categories = {
  get: sql("categories/get.sql"),
  add: sql("categories/add.sql")
};

export const products = {
  getAll: sql("products/getAll.sql"),
  getByFilters: sql("products/getByFilters.sql"),
  getByOwner: sql("products/getByOwner.sql"),
  getById: sql("products/getById.sql"),
  getImages: sql("products/getImages.sql"),
  addWithAllFields: sql("products/addWithAllFields.sql"),
  add: sql("products/add.sql"),
  addImages: sql("products/addImages.sql"),
  update: sql("products/update.sql")
};

export const users = {
  getAll: sql("users/getAll.sql"),
  getByEmail: sql("users/getByEmail.sql"),
  getById: sql("users/getById.sql"),
  getImage: sql("users/getImage.sql"),
  getCredentials: sql("users/getCredentials.sql"),
  add: sql("users/add.sql"),
  addImage: sql("users/addImage.sql"),
  update: sql("users/update.sql"),
  updateEmail: sql("users/updateEmail.sql"),
  updatePassword: sql("users/updatePassword.sql"),
  delete: sql("users/delete.sql")
};

export const reviews = {
  get: sql("reviews/get.sql"),
  add: sql("reviews/add.sql")
};

export const global = {
  truncateAll: sql("global/truncateAll.sql")
};
