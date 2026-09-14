import { Router } from "express";
import authRouter from "./auth.routes.js";
import userRouter from "./user.routes.js";
import blogRouter from "./blog.routes.js";
import postRouter from "./post.routes.js";
import commentRouter from "./comment.routes.js";

const apiV1Router = Router();

const mountings = [
    { path: "/users", router: authRouter },
    { path: "/users", router: userRouter },
    { path: "/blog", router: blogRouter },
    { path: "/post", router: postRouter },
    { path: "/post/comment", router: commentRouter },
];

mountings.forEach(({ path, router }) => apiV1Router.use(path, router));

export { apiV1Router };