import bodyParser from "body-parser";
import verifyUser from "../../middlewares/verifyUser";
import verifyProduct from "../../middlewares/verifyProduct";
import auth from "../../middlewares/auth";
import {
  readProducts,
  readOneProduct,
  createProduct,
  updateOneProduct,
  deleteOneProduct
} from "../controllers/products/products";

const jsonParser = bodyParser.json({ limit: "50mb" });

export default router => {
  router.post("/products", auth, verifyUser, jsonParser, createProduct);

  router.get("/products", readProducts);
  router.get("/products/:productId", readOneProduct);

  router.put(
    "/products/:productId",
    auth,
    verifyUser,
    verifyProduct,
    jsonParser,
    updateOneProduct
  );

  router.delete(
    "/products/:productId",
    auth,
    verifyUser,
    verifyProduct,
    deleteOneProduct
  );

  return router;
};
