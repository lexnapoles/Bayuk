import chai from "chai";
import request from "supertest";
import faker from "faker";
import createServer from "../../server/server";
import db from "../../server/db";
import {global} from "../../server/sql/sql";
import {addUser} from "../../server/api/services/users";
import {addReview} from "../../server/api/services/reviews";
import addCategories from "../../server/seeder/database/categoriesTableSeeder";
import {addProduct} from "../../server/api/services/products"
import {invalidReview} from "../../server/errors/api/reviewErrors";
import {unauthorizedAccess} from "../../server/errors/api/authorizationErrors";
import {userDoesNotExist} from "../../server/errors/api/userErrors";
import {dataNotFound} from "../../server/errors/api/controllerErrors";
import {getUser} from "../../server/seeder/database/usersTableSeeder";
import {createJwt} from "../../server/api/services/authentication"

chai.should();

let server = {};

const product = {
	name:        "Ray Ban sunglasses",
	description: "Good as new, original Ray Ban sunglasses",
	category:    "Accessories",
	price:       50,
	images:      [
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
		.then(users => usersData = {
			buyer:  users[0],
			seller: users[1]
		})
		.then(() => addProduct({...product, owner: usersData.seller.user.id}))
		.then((data) => ({
			...usersData,
			product: data.id
		}))
};

const addRandomReview = () =>
	generateReviewData()
		.then(({buyer, seller, product}) => addReview({
			rating:      5,
			description: faker.lorem.sentences(),
			buyer:       buyer.user.id,
			seller:      seller.user.id,
			product
		}));

describe("Reviews", function () {
	beforeEach(function () {
		return db.none(global.truncateAll)
			.then(() => addCategories())
			.then(() => server = createServer());
	});

	afterEach(function (done) {
		db.none(global.truncateAll);

		server.close(done);
	});

	describe("GET /reviews/:userId", function () {
		it("should get the user reviews", function () {
			return addRandomReview()
				.then(({seller}) =>
					request(server)
						.get(`/api/reviews/${seller}`)
						.expect(200))
				.then(response => {
					const reviews = response.body,
								review  = response.body[0];

					reviews.should.be.instanceOf(Array);
					reviews.should.not.be.empty;

					review.should.include.all.keys(["id", "rating", "description", "buyer", "seller", "product"]);
				});
		});
	});

	describe("POST /reviews", function () {
		it("should add a new review", function () {
			return generateReviewData()
				.then(({buyer, seller, product}) => {
					const {user: {id: buyerId}, token} = buyer,
								{user: {id: sellerId}}       = seller;

					return request(server)
						.post(`/api/reviews`)
						.set("Authorization", `Bearer ${token}`)
						.send({
							buyer:       buyerId,
							seller:      sellerId,
							rating:      4,
							description: "Good seller, product in good condition",
							product
						})
						.expect(201)
						.expect("Location", `/api/reviews/${sellerId}`)
				})
				.then(response => {
					const review = response.body;

					review.should.include.all.keys(["id", "rating", "description", "buyer", "seller", "product"]);
				})
		});

		it("should fail when no data has been sent", function () {
			return generateReviewData()
				.then(({buyer}) => {
					const {token} = buyer;

					return request(server)
						.post(`/api/reviews`)
						.set("Authorization", `Bearer ${token}`)
						.expect(400)
				})
				.then(response => {
					const error = response.body[0];

					error.should.be.deep.equal(dataNotFound("body"))
				})
		});

		it("should fail when invalid data has been sent", function () {
			return generateReviewData()
				.then(({buyer, product}) => {
					const {user: {id: buyerId}, token} = buyer;

					return request(server)
						.post(`/api/reviews`)
						.set("Authorization", `Bearer ${token}`)
						.send({
							buyer:       buyerId,
							seller:      "Invalid seller",
							rating:      "A rating",
							description: "Good seller",
							product
						})
						.expect(400)
				})
				.then(response => {
					const errors      = response.body,
								ratingError = invalidReview("rating", "should be integer"),
								sellerError = invalidReview("seller", 'should match format "uuid"');

					errors.should.be.instanceOf(Array);
					errors.should.not.be.empty;

					errors.should.deep.include.members([ratingError, sellerError]);
				});
		});

		it("should fail when no token has been sent", function () {
			return request(server)
				.post(`/api/reviews`)
				.expect(401)
				.then(response => {
					const error = response.body[0];

					error.should.be.deep.equal(unauthorizedAccess())
				});
		});

		it("should fail when token is valid but the user can't be found", function () {
			const validTokenForNonExistentUser = createJwt(getUser({id: faker.random.uuid()}));

			return request(server)
				.post(`/api/reviews`)
				.set("Authorization", `Bearer ${validTokenForNonExistentUser}`)
				.expect(404)
				.then(response => {
					const error = response.body[0];

					error.should.be.deep.equal(userDoesNotExist());
				})
		});

		it("should fail when the token user is not the one to write the review", function () {
			return generateReviewData()
				.then(({buyer, seller, product}) => {
					const {user: {id: sellerId}} = seller,
								{token}                = buyer;

					return request(server)
						.post(`/api/reviews`)
						.set("Authorization", `Bearer ${token}`)
						.send({
							seller:      sellerId,
							buyer:       faker.random.uuid(),
							rating:      4,
							description: "Good seller, product in good condition",
							product
						})
						.expect(401)
				})
				.then(response => {
					const error = response.body[0];

					error.should.be.deep.equal(unauthorizedAccess())
				});
		});
	});
});
