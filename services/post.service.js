"use strict";

const DbMixin = require("../mixins/db.mixin");
const { MoleculerClientError } = require("moleculer").Errors;

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
			"comments",
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
						comments: [],
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					return inserted;
				} catch (err) {
					return { success: false, };
				}
			},
		},

		createComment: {
			rest: "POST /create-comment",
			params: {
				postId: "string",
				body: "string",
			},
			async handler(ctx) {
				const {postId, body} = ctx.params

				const foundPost = await this.adapter.findById(postId)

				if (!foundPost) {
					throw new MoleculerClientError("post_not_valid");
				}

				const result = await this.adapter.updateById(postId, {
					$set: {
						comments: [...foundPost.comments, {
							id: this.generateId(20, false),
							body: body,
							createdAt: new Date(),
							updatedAt: new Date(),
						}],
					}
				})
				return result;
			},
		},

		updateComment: {
			rest: "POST /update-comment",
			params: {
				postId: "string",
				commentId: "string",
				body: "string",
			},
			async handler(ctx) {
				const {postId, commentId, body} = ctx.params

				const foundPost = await this.adapter.findById(postId)

				if (!foundPost) {
					throw new MoleculerClientError("post_not_valid");
				}

				const foundCommentIndex = foundPost.comments.findIndex((el) => el.id === commentId);

				if (!foundCommentIndex < 0) {
					throw new MoleculerClientError("comment_not_found");	
				}

				const updatedComments = [
					...foundPost.comments.slice(0, foundCommentIndex),
					{
						id: foundPost.comments[foundCommentIndex].id,
						body: body,
						createdAt: foundPost.comments[foundCommentIndex].createdAt,
						updatedAt: new Date(),
					},
					...foundPost.comments.slice(foundCommentIndex + 1, foundPost.comments.length)
				]

				const result = await this.adapter.updateById(postId, {
					$set: {
						comments: updatedComments,
					}
				})
				return result;
			},
		},

		deleteComment: {
			rest: "POST /delete-comment",
			params: {
				postId: "string",
				commentId: "string",
			},
			async handler(ctx) {
				const {postId, commentId} = ctx.params

				const foundPost = await this.adapter.findById(postId)

				if (!foundPost) {
					throw new MoleculerClientError("post_not_valid");
				}

				const foundCommentIndex = foundPost.comments.findIndex((el) => el.id === commentId);

				if (!foundCommentIndex < 0) {
					throw new MoleculerClientError("comment_not_found");	
				}

				const updatedComments = foundPost.comments.filter((comment) => comment.id !== commentId);

				const result = await this.adapter.updateById(postId, {
					$set: {
						comments: updatedComments,
					}
				})
				return result;
			},
		},
	},



	/**
	 * Methods
	 */
	methods: {
		generateId(length, easyRead) {
			var result           = '';
			var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
			if(easyRead)
					characters  = 'abcdefghijklmnpqrstuvwxyz123456789'; //Remove confusing characters like 0 and O
			var charactersLength = characters.length;
			for ( var i = 0; i < length; i++ ) {
				 result += characters.charAt(Math.floor(Math.random() * charactersLength));
			}
			return result;
	 }
	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
