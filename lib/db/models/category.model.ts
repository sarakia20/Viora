import { Document, Model, model, models, Schema } from 'mongoose'
export interface ICategory extends Document {
  name: string
  slug: string
  parentId?: string | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: String, default: null },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

const Category =
  (models.Category as Model<ICategory>) ||
  model<ICategory>('Category', CategorySchema)

export default Category