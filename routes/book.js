import express from 'express';
import {check, validationResult} from "express-validator";
import {PrismaClient} from "@prisma/client";
import user from "./user.js";

const router = express.Router();
const prisma = new PrismaClient()

//ログインチェック
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({message: "ログインしてないですけど"});
        return
    }
    next();
})

router.get('/list',async (req, res, next) => {
    const page = +req.query.page;
    try {
        const books = await prisma.books.findMany({
            orderBy: {
             publishDate: 'desc'
            }
        })
        res.json({books})
    }catch (e) {
        next(e)
    }
})

router.get('/detail/:id', async (req, res, next) => {
    const id = +req.params.id;
    try {
        const book = await prisma.books.findUnique({
            where:{
                id: id
            },
            include:{
                rental:{
                    select:{
                        userName: user.name,
                        rentalDate: true,
                        returnDeadLine: true,
                    }
                }
            }
        })
        res.json({book})
    }catch (e) {
        next(e)
    }
})

export default router;