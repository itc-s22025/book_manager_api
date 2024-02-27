import express from 'express';
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

//ログインチェック
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({message: "NG"});
        return
    }
    next();
})


//貸出
router.post('/start', async (req, res, next) => {
    try {
        const bookId = +req.body.id;
        const book = await prisma.books.findUnique(
            {
                where: {
                    id: bookId
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
                bookId: bookId,
                //返却日がnullのレコード->貸出されてない
                returnDate: null
            }
        })
        if (isRental) {
            return res.status(409).json({message: "貸出中のため失敗"})
        }

        //貸出
        const rental = await prisma.rental.create({
            data: {
                user: {connect: {id: +req.user.id}},
                book: {connect: {id: bookId}},
                rentalDate: new Date(),
                returnDeadLine: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //７日後
            }
        })
        res.status(201).json({message: "貸出成功", res: rental})

    } catch (e) {
        res.status(400).json({message: "その他のエラー"})
    }
})


//返却
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

        //存在する貸出データか
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


//借用書籍一覧
router.get('/current', async (req, res, next) => {
    try {
        const userId = +req.user.id
        const currentRentals = await prisma.rental.findMany({
            where: {
                userId: userId,
                returnDate: null //まだ返却してないやつ
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                rentalDate: 'desc'
            }
        })

        const rentalBooks = currentRentals.map(rental => ({
            rentalId: rental.id,
            bookId: rental.bookId,
            bookName: rental.book.title,
            rentalDate: rental.rentalDate,
            returnDeadLine: rental.returnDeadLine
        }));

        res.status(200).json({rentalBooks})

    } catch (e) {
        console.log(e)
    }
})


//借用書籍履歴
router.get('/history', async (req, res, next) => {
    try {
        const hist = await prisma.rental.findMany({
            where: {
                userId: +req.user.id
            },
            include: {
                book: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                rentalDate: 'desc'
            }
        })

        const rentalHistory = hist.map(rental => ({
            rentalId: rental.id,
            bookId: rental.bookId,
            bookName: rental.book.title,
            rentalDate: rental.rentalDate,
            returnDeadLine: rental.returnDeadLine
        }))
        res.status(200).json({rentalHistory})

    } catch (e) {
        console.log(e)
    }
})

export default router;