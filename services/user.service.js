"use strict";

const DbMixin = require("../mixins/db.mixin");
const { MoleculerClientError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");
const _ = require("lodash");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: "user",
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbMixin("user")],

	/**
	 * Settings
	 */
	settings: {
		idField: "_id",
		fields: [
			"_id",
      "email",
      "password",
      "createdAt",
      "updatedAt",
		],
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			create: [
				function addTimestamp(ctx) {
					ctx.params.createdAt = new Date();
					ctx.params.updatedAt = new Date();
					return ctx;
				},
			],
		},
	},

	/**
	 * Actions
	 */
	actions: {
		list: {
			cache: false,
		},
		get: {
			cache: false,
		},
		register: {
			rest: "POST /register",
			params: {
				email: "string",
				password: "string",
			},
			async handler(ctx) {
				const {email, password} = ctx.params

				try {
          if (email) {
            const found = await this.adapter.findOne({
              email,
            });
            if (found) {
              throw new MoleculerClientError("email_already_exists");
            }
          }

					const user = await this.adapter.insert({
						email,
						password,
						createdAt: new Date(),
						updatedAt: new Date(),
					})

          const response = {
            user: user,
            token: this.generateJWT(_.cloneDeep(user)),
          }
          
					return response;
				} catch (err) {
					return err.message;
				}
			},
		},

    login: {
      rest: "POST /login",
			params: {
				email: "string",
				password: "string",
			},
			async handler(ctx) {
				const {email, password} = ctx.params

				try {
          if (email) {
            const found = await this.adapter.findOne({
              email,
            });
            if (!found) {
              throw new MoleculerClientError("user_not_found");
            }

            if (found.password !== password) {
              throw new MoleculerClientError("password_not_valid");
            }

            const response = {
              user: found,
              token: this.generateJWT(_.cloneDeep(found)),
            }
            
            return response;
          } else {
            throw new MoleculerClientError("eamil_not_valid");
          }
				} catch (err) {
					return err.message;
				}
			},
    }
	},

	/**
	 * Methods
	 */
	methods: {
    generateJWT: function (entity) {
      // console.log('entity:', entity)
      const jwtString = jwt.sign(
        {
          ...entity,
          exp: Math.floor(Date.now() / 1000) + 3600 * 60 * 60 * 365,
        },
        "token"
      );
      return jwtString;
    },
	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
