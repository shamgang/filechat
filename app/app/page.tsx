import FilesForm from './FilesForm';

interface HomeProps {
  searchParams: { error?: string }
}

export default function Home({ searchParams }: HomeProps) {
  async function submitForm(formData: FormData) {
    'use server'

    console.log(formData);
  }
  return (
    <div className="w-screen h-screen flex flex-col gap-4 items-center justify-center">
      <div className="size-11/12 md:w-3/4 lg:w-1/2 md:h-3/4 bg-slate-600 bg-opacity-50 rounded-sm p-10">
        <h1 className="text-xl md:text-3xl text-white font-sans font-bold italic uppercase">
          Chat with your files
        </h1>
        <br/>
        <p className="text-white text-sm md:text-lg">
          Load a public Google Drive folder with Google Docs or PDFs, or upload PDFs.
          <br/>
          WARNING: This demo is not secure. Do not upload private information.
        </p>
        <br/>
        <FilesForm submitForm={submitForm} error={searchParams.error}/>
      </div>
    </div>
  );
}
