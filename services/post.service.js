"use strict";

const DbMixin = require("../mixins/db.mixin");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: "post",
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbMixin("post")],

	/**
	 * Settings
	 */
	settings: {
		idField: "_id",
		fields: [
			"_id",
			"title",
			"body",
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
		createPost: {
			rest: "POST /create-post",
			params: {
				title: "string",
				body: "string",
			},
			async handler(ctx) {
				const {title, body} = ctx.params

				try {
					const inserted = await this.adapter.insert({
						title,
						body,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					return inserted;
				} catch (err) {
					return { success: false, };
				}
			},
		},
	},

	/**
	 * Methods
	 */
	methods: {
		
	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
