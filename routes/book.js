import express from 'express';
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

const maxPerPage = 2;

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
    const page = req.query.page ? +req.query.page : 1;
    const skip = maxPerPage * (page - 1);

    try {
        const [books, count] = await Promise.all([
            prisma.books.findMany({
                orderBy: {
                    publishDate: 'desc'
                },
                skip,
                take: maxPerPage
            }),
            //全体の書籍数
            prisma.books.count()
        ]);
        //最大ページ数計算
        const maxPage = Math.ceil(count / maxPerPage);

        //指定されたpageの値が最大ページ数より大きいとき
        if (page > maxPage) {
            return res.status(404).json({message: "ページが見つかりません"});
        }

        const formattedBooks = books.map(book => {
            delete book.isbn13;
            return book;
        });
        res.status(200).json({books: formattedBooks, maxPage})

    } catch (e) {
        res.status(400).json({message: e})
    }
});


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