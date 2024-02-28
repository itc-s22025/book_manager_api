import express from 'express';
import {PrismaClient} from "@prisma/client";
import user from "./user.js";
import book from "../admin/book.js";

const router = express.Router();
const prisma = new PrismaClient()

//ログインチェック
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({result: "NG"});
        return
    }
    next();
})


//書籍一覧
router.get('/list', async (req, res, next) => {
    //ここあとで直す
    const page = +req.query.page;
    const maxPage = 10;

    try {
        const books = await prisma.books.findMany({
            orderBy: {
                publishDate: 'desc'
            }
        })

        const formattedBooks = books.map(book => {
            delete book.isbn13;
            return book;
        });

        res.status(200).json({books: formattedBooks})
    } catch (e) {
        res.status(400).json({message: e})
    }
})


//書籍詳細
router.get('/detail/:id', async (req, res, next) => {
    const id = +req.params.id;
    try {
        const book = await prisma.books.findUnique({
            where: {
                id: id
            },
            include: {
                rental: {
                    select: {
                        user: {
                            select: {
                                name: true
                            }
                        },
                        rentalDate: true,
                        returnDeadLine: true,
                    }
                }
            }
        })

        const rentalInfo = book.rental.map(rental => ({
            userName: rental.user.name,
            rentalDate: rental.rentalDate,
            returnDeadLine: rental.returnDeadLine
        }))

        delete book.rental;
        book.rentalInfo = rentalInfo

        res.status(200).json(book);

    } catch (e) {
        res.status(400).json({message: e})
    }
})

export default router;