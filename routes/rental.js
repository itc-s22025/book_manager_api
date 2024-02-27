import express from 'express';
import {check, validationResult} from "express-validator";
import {PrismaClient} from "@prisma/client";
import user from "./user.js";

const router = express.Router();
const prisma = new PrismaClient()

//ログインチェック
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({message: "NG from rental"});
        return
    }
    next();
})

router.post('/start', async (req, res, next) => {
    try {
        const id = +req.body.id;
        const book = await prisma.books.findUnique(
            {
                where: {
                    id
                }
            }
        )
        //存在する書籍か
        if (!book) {
            return res.status(404).json({message: "存在しない書籍っぽい"})
        }

        //貸出状況
        const isRental = await prisma.rental.findFirst({
            where: {
                bookId: id,
                //返却日がnullのレコード->貸出されてない
                returnDate: null
            }
        })

        if (isRental) {
            return res.status(409).json({message: "貸出中のため失敗"})
        }

        const rental = await prisma.rental.create({
            data: {
                user: {connect: {id: +req.body.userId}},
                book: {connect: {id: id}},
                rentalDate: new Date(),
                returnDeadLine: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //７日後
            }
        })

        res.status(201).json({message: "貸出成功", res: rental})
    } catch (e) {
        res.status(400).json({message: "その他のエラー"})
    }
})

router.post('/return', async (req, res, next) => {
    try {
        const rentalId = +req.body.rentalId
        const isRental = await prisma.rental.findUnique({
            where: {
                id: rentalId
            },
            include: {
                book: true
            }
        });

        if (!isRental) {
            return res.status(404).json({message: "存在しない貸出データっぽい"})
        }

        //レンタル情報更新
        const updateRental = await prisma.rental.update({
            where: {
                id: rentalId
            },
            data: {
                returnDate: new Date() //今
            }
        });
        res.status(200).json({result: "OK"});

    } catch (e) {
        res.status(400).json({message: "NG"})
    }
})

export default router;