'use server'

import bcrypt from 'bcryptjs'
import { auth, signIn, signOut } from '@/auth'
import { IUserName, IUserSignIn, IUserSignUp } from '@/types'
import { UserSignUpSchema, UserUpdateSchema } from '../validator'
import { connectToDatabase } from '../db'
import User, { IUser } from '../db/models/user.model'
import { formatError } from '../utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import { requireAdmin } from '../auth-guard'
import Order from '../db/models/order.model'
import { Types } from 'mongoose'

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      phone: userSignUp.phone,
     
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    await connectToDatabase()

    await User.create({
      ...user,
     
      password: await bcrypt.hash(user.password, 12),
    })

    return { success: true, message: 'حساب کاربری با موفقیت ایجاد شد' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
}

// DELETE
export async function deleteUser(id: string) {
  try {
    const session = await requireAdmin()
    if (session.user.id === id) throw new Error('You cannot delete your own account')
    await connectToDatabase()

    const res = await User.findByIdAndDelete(id)

    if (!res) throw new Error('کاربر یافت نشد')

    revalidatePath('/admin/users')

    return {
      success: true,
      message: 'کاربر با موفقیت حذف شد',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    await requireAdmin()
    await connectToDatabase()

    const dbUser = await User.findById(user._id)

    if (!dbUser) throw new Error('کاربر یافت نشد')

    dbUser.name = user.name
    dbUser.phone = user.phone
    dbUser.email = user.email || undefined
    dbUser.role = user.role

    const updatedUser = await dbUser.save()

    revalidatePath('/admin/users')

    return {
      success: true,
      message: 'اطلاعات کاربر با موفقیت بروزرسانی شد',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function updateUserName(user: IUserName) {
  try {
    await connectToDatabase()

    const session = await auth()
    const currentUser = await User.findById(session?.user?.id)

    if (!currentUser) throw new Error('کاربر یافت نشد')

    currentUser.name = user.name

    const updatedUser = await currentUser.save()

    return {
      success: true,
      message: 'نام کاربر با موفقیت بروزرسانی شد',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn('credentials', {
    phone: user.phone,
    password: user.password,
    redirect: false,
  })
}

export const SignInWithGoogle = async () => {
  await signIn('google')
}

export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
}

// GET
export async function getAllUsers({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  await requireAdmin()
  const {
    common: { pageSize },
  } = await getSetting()

  limit = limit || pageSize

  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit

  const users = await User.find()
    .select('name phone email role')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
    .lean()

  const usersCount = await User.countDocuments()
  const orderCounts = users.length
    ? await Order.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { user: { $in: users.map(({ _id }) => _id) } } },
        { $group: { _id: '$user', total: { $sum: 1 } } },
      ])
    : []
  const totalsByUser = new Map(orderCounts.map(({ _id, total }) => [String(_id), total]))

  return {
    data: users.map(({ _id, name, phone, email, role }) => ({
      _id: String(_id),
      name,
      phone,
      email,
      role,
      orderCount: totalsByUser.get(String(_id)) ?? 0,
    })),
    totalPages: Math.ceil(usersCount / limit),
  }
}

export async function getUserById(userId: string) {
  await requireAdmin()
  await connectToDatabase()

  const user = await User.findById(userId)

  if (!user) throw new Error('کاربر یافت نشد')

  return JSON.parse(JSON.stringify(user)) as IUser
}
