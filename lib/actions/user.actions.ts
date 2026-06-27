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

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      phone: userSignUp.phone,
      email: userSignUp.email || undefined,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    await connectToDatabase()

    await User.create({
      ...user,
      email: user.email || undefined,
      password: await bcrypt.hash(user.password, 5),
    })

    return { success: true, message: 'حساب کاربری با موفقیت ایجاد شد' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
}

// DELETE
export async function deleteUser(id: string) {
  try {
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
  const {
    common: { pageSize },
  } = await getSetting()

  limit = limit || pageSize

  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit

  const users = await User.find()
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)

  const usersCount = await User.countDocuments()

  return {
    data: JSON.parse(JSON.stringify(users)) as IUser[],
    totalPages: Math.ceil(usersCount / limit),
  }
}

export async function getUserById(userId: string) {
  await connectToDatabase()

  const user = await User.findById(userId)

  if (!user) throw new Error('کاربر یافت نشد')

  return JSON.parse(JSON.stringify(user)) as IUser
}