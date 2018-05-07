/*
  eslint-disable
  no-unused-expressions,
  prefer-arrow-callback,
  import/no-extraneous-dependencies,
  func-names,
  no-tabs
 */

import chai from "chai";
import request from "supertest";
import faker from "faker";
import stoppable from "stoppable";
import createServer from "../../server/server";
import db from "../../server/database/db";
import { global } from "../../server/database/sql/sql";
import { addUser } from "../../server/api/services/users";
import { addReview } from "../../server/api/services/reviews";
import addCategories from "../../server/seeder/database/categoriesTableSeeder";
import { addProduct } from "../../server/api/services/products";
import invalidReview from "../../server/errors/api/reviewErrors";
import { unauthorizedAccess } from "../../server/errors/api/authorizationErrors";
import { userDoesNotExist } from "../../server/errors/api/userErrors";
import {
  dataNotFound,
  invalidId
} from "../../server/errors/api/controllerErrors";
import { getUser } from "../../server/seeder/database/usersTableSeeder";
import { createJwt } from "../../server/api/services/authentication";
import { cleanAllPreviouslyCreatedImages } from "../../server/seeder/filesystem/productsImagesSeeder";

chai.should();

let server = {};

const product = {
  name: "Ray Ban sunglasses",
  description: "Good as new, original Ray Ban sunglasses",
  category: "Accessories",
  price: 50,
  images: [
    `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAeAB4AAD/2wBDAAcFBQYFBAcGBQYIBwcIChE
			LCgkJChUPEAwRGBUaGRgVGBcbHichGx0lHRcYIi4iJSgpKywrGiAvMy8qMicqKyr/2wBDAQcICAoJCh
			QLCxQqHBgcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKir/w
			AARCAAXAB0DASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUBAwQG/8QAIxAAAQMFAAICAwAA
			AAAAAAAAAQACEQMEEiExQVETImGRof/EABgBAAMBAQAAAAAAAAAAAAAAAAIDBgEF/8QAHREAAgICAwE
			AAAAAAAAAAAAAAAECAwQRBRJRQf/aAAwDAQACEQMRAD8AQNP7mIVr3wzsQFly+pJaOQ3flUV7ks1Oz0
			KZS2ccLq4AbA9SYS+pfMJGR/qmvXIBLRr17SmrlUdJdj+I4nxrTB6nW4yMna1KxXtOSXP5HR4QhJRov
			rAfIcSYIiUnurksuXMDSIjYPUIVLweLTlXyhdHaUd/fV4Gf/9k=`,

    `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAeAB4AAD/2wBDAAcFBQYFBAcGBQYIBwcIChE
			LCgkJChUPEAwRGBUaGRgVGBcbHichGx0lHRcYIi4iJSgpKywrGiAvMy8qMicqKyr/2wBDAQcICAoJCh
			QLCxQqHBgcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKir/w
			AARCAAXAB0DASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUBAwQG/8QAIxAAAQMFAAICAwAA
			AAAAAAAAAQACEQMEEiExQVETImGRof/EABgBAAMBAQAAAAAAAAAAAAAAAAIDBgEF/8QAHREAAgICAwE
			AAAAAAAAAAAAAAAECAwQRBRJRQf/aAAwDAQACEQMRAD8AQNP7mIVr3wzsQFly+pJaOQ3flUV7ks1Oz0
			KZS2ccLq4AbA9SYS+pfMJGR/qmvXIBLRr17SmrlUdJdj+I4nxrTB6nW4yMna1KxXtOSXP5HR4QhJRov
			rAfIcSYIiUnurksuXMDSIjYPUIVLweLTlXyhdHaUd/fV4Gf/9k=`
  ]
};

const generateReviewData = () => {
  let usersData = {};

  return Promise.all([addUser(getUser()), addUser(getUser())])
    .then(([sourceUser, targetUser]) => {
      usersData = {
        source: {
          user: sourceUser,
          token: createJwt(sourceUser)
        },
        target: {
          user: targetUser,
          token: createJwt(targetUser)
        }
      };
    })
    .then(() =>
      addProduct({
        ...product,
        owner: usersData.target.user.id
      })
    )
    .then(data => ({
      ...usersData,
      product: data.id
    }));
};

const addRandomReview = () =>
  generateReviewData().then(({ source, target, product: reviewProduct }) =>
    addReview({
      rating: 5,
      description: faker.lorem.sentences(),
      source: source.user.id,
      target: target.user.id,
      product: reviewProduct
    })
  );

describe.only("Reviews", function() {
  beforeEach(function() {
    return cleanAllPreviouslyCreatedImages()
      .then(() => db.none(global.truncateAll))
      .then(() => addCategories())
      .then(() => {
        server = stoppable(createServer(5000), 0);
      });
  });

  afterEach(function() {
    return cleanAllPreviouslyCreatedImages()
      .then(() => db.none(global.truncateAll))
      .then(() => server.stop());
  });

  describe("GET /reviews/:userId", function() {
    it.only("should get the user reviews", function() {
      return addRandomReview()
        .then(({ target }) =>
          request(server)
            .get(`/api/reviews/${target}`)
            .expect(400)
        )
        .then(response => {
          const reviews = response.body;
          const review = response.body[0];

          reviews.should.be.instanceOf(Array);
          reviews.should.not.be.empty;

          review.should.include.all.keys([
            "id",
            "rating",
            "description",
            "source",
            "target",
            "product"
          ]);
        });
    });

    it("should get selected fields", function() {
      const selectedFields = ["rating", "source", "target"];

      return addRandomReview()
        .then(({ target }) =>
          request(server)
            .get(`/api/reviews/${target}`)
            .query({
              fields: selectedFields.join()
            })
            .expect(200)
        )
        .then(response => {
          const review = response.body[0];

          review.should.have.all.deep.keys(selectedFields);
        });
    });

    it("should embed included user fields", function() {
      const includeFields = ["source", "target"];

      return addRandomReview()
        .then(({ target }) =>
          request(server)
            .get(`/api/reviews/${target}`)
            .query({
              include: includeFields.join()
            })
            .expect(200)
        )
        .then(response => {
          const review = response.body[0];

          review.should.have.property("users");
        });
    });

    it("should fail when the user id is not valid", function() {
      const userId = undefined;

      return request(server)
        .get(`/api/reviews/${userId}`)
        .expect(400)
        .then(response => {
          const error = response.body[0];

          error.should.be.deep.equal(invalidId());
        });
    });
    it("should fail if there's no user with the given id", function() {
      return request(server)
        .get(`/api/reviews/${faker.random.uuid()}`)
        .expect(404);
    });
  });

  describe("POST /reviews", function() {
    it("should add a new review", function() {
      return generateReviewData()
        .then(({ source, target, product: reviewProduct }) => {
          const {
            user: { id: buyerId },
            token
          } = source;
          const {
            user: { id: sellerId }
          } = target;

          return request(server)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${token}`)
            .send({
              source: buyerId,
              target: sellerId,
              rating: 4,
              description: "Good seller, product in good condition",
              product: reviewProduct
            })
            .expect(201)
            .expect("Location", `/api/reviews/${sellerId}`);
        })
        .then(response => {
          const review = response.body;

          review.should.include.all.keys([
            "id",
            "rating",
            "description",
            "source",
            "target",
            "product"
          ]);
        });
    });

    it("should fail when no data has been sent", function() {
      return generateReviewData()
        .then(({ source }) => {
          const { token } = source;

          return request(server)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${token}`)
            .expect(400);
        })
        .then(response => {
          const error = response.body[0];

          error.should.be.deep.equal(dataNotFound("body"));
        });
    });

    it("should fail when invalid data has been sent", function() {
      return generateReviewData()
        .then(({ source, product: reviewProduct }) => {
          const {
            user: { id: buyerId },
            token
          } = source;

          return request(server)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${token}`)
            .send({
              source: buyerId,
              target: "Invalid seller",
              rating: "A rating",
              description: "Good seller",
              product: reviewProduct
            })
            .expect(400);
        })
        .then(response => {
          const errors = response.body;
          const ratingError = invalidReview("rating", "should be integer");
          const targetError = invalidReview(
            "target",
            'should match format "uuid"'
          );

          errors.should.be.instanceOf(Array);
          errors.should.not.be.empty;

          errors.should.deep.include.members([ratingError, targetError]);
        });
    });

    it("should fail when no token has been sent", function() {
      return request(server)
        .post("/api/reviews")
        .expect(401)
        .then(response => {
          const error = response.body[0];

          error.should.be.deep.equal(unauthorizedAccess());
        });
    });

    it("should fail when token is valid but the user can't be found", function() {
      const validTokenForNonExistentUser = createJwt(
        getUser({ id: faker.random.uuid() })
      );

      return request(server)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${validTokenForNonExistentUser}`)
        .expect(404)
        .then(response => {
          const error = response.body[0];

          error.should.be.deep.equal(userDoesNotExist());
        });
    });

    it("should fail when the token user is not the one to write the review", function() {
      return generateReviewData()
        .then(({ source, target, product: reviewProduct }) => {
          const { token } = source;
          const {
            user: { id: sellerId }
          } = target;

          return request(server)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${token}`)
            .send({
              target: sellerId,
              source: faker.random.uuid(),
              rating: 4,
              description: "Good seller, product in good condition",
              product: reviewProduct
            })
            .expect(401);
        })
        .then(response => {
          const error = response.body[0];

          error.should.be.deep.equal(unauthorizedAccess());
        });
    });
  });
});
