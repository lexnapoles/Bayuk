import chai from "chai";
import request from "supertest";
import db from "../../server/db";
import {global} from "../../server/sql/sql";
import {addCategories} from "../../server/api/services/categories";
import createServer from "../../server/server";
import stoppable from "stoppable";

chai.should();

let server = {};

describe("Categories", function () {
	describe("GET /categories", function () {
		beforeEach(function () {
			server = stoppable(createServer(), 0)

			return db.none(global.truncateAll);
		});

		afterEach(function (done) {
			server.stop(done);
		});

		it("should get all categories", function () {
			const categories = ["TV", "Movies"];

			return addCategories(categories)
				.then(() =>
					request(server)
						.get("/api/categories")
						.expect(200))
				.then(response => {
					response.body.should.be.instanceOf(Array);
					response.body.should.be.deep.equal(categories)
				});
		});
	});
});

