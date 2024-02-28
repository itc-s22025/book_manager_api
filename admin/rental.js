import express from 'express';
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()


//ログインチェック 管理者ユーザならアクセスできる
router.use((req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({message: "NG"});
    }
});

router.get('/', async (req, res, next) => {
    res.json({msg: "admin/rental"})
});


//全ユーザの貸出中書籍一覧
router.get('/current', async (req, res, next) => {
    try {
        const rentalData = await prisma.rental.findMany({
            where: {
                returnDate: null
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
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

        const rentalBooks = rentalData.map(rental => ({
            rentalId: rental.id,
            userId: rental.userId,
            userName: rental.user.name,
            bookId: rental.bookId,
            bookName: rental.book.title,
            rentalDate: rental.rentalDate,
            returnDeadLine: rental.returnDeadLine
        }))
        res.status(200).json({rentalBooks})

    } catch (e) {
        console.log(e)
    }
})


//特定ユーザの貸出中書籍一覧
router.get('/current/:uid', async (req, res, next) => {
    try {
        const uid = +req.params.uid;
        const individualRentalData = await prisma.rental.findMany({
            where: {
                userId: uid,
                returnDate: null
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
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

        const formattedData = individualRentalData.map(rental => ({
            userId: uid,
            userName: rental.user.name,
            rentalBooks:{
                rentalId: rental.id,
                bookId: rental.bookId,
                bookName: rental.book.title,
                rentalDate: rental.rentalDate,
                returnDeadLine: rental.returnDeadLine
            }
        }))

        res.status(200).json(formattedData)

    } catch (e) {
        console.log(e)
    }
})
export default router;