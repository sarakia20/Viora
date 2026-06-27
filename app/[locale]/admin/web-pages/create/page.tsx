import { Metadata } from 'next'
import WebPageForm from '../web-page-form'

export const metadata: Metadata = {
  title: 'ایجاد صفحه جدید',
}

export default function CreateWebPagePage() {
  return (
    <>
      <h1 className='h1-bold'>ایجاد صفحه جدید</h1>

      <div className='my-8'>
        <WebPageForm type='Create' />
      </div>
    </>
  )
}
