
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { uploadImage } from '#/server/upload';
import { base64Converter } from '#/utils/base64Converter';


export const Route = createFileRoute('/auth/receipts')({
  component: RouteComponent,
})

function RouteComponent() {


    const [file, setFile] = useState<File | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (fileList && fileList.length > 0) {
            setFile(fileList[0]);
        } else {
          setFile(null);
        }
    };

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log(file)
        if (!file) return
        const imageBase64 = await base64Converter(file)
        console.log('converted to base64')
        const result = await uploadImage({
            data: {
              image: imageBase64,
          }
        })
        console.log(result)
        setIsOpen(false);
     };

    return (
        <div>
            <h3>Scan Receipts</h3>
            <Dialog open={isOpen}>

                <DialogTrigger>
                    <Button variant="outline" onClick={() => setIsOpen(true)}>Open Dialog</Button>
                </DialogTrigger>
                <form onSubmit={handleSubmit}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                          Make changes to your profile here. Click save when you&apos;re
                          done.
                        </DialogDescription>
                    </DialogHeader>
                        <Input type='file' onChange={handleFileChange} />
                      <DialogFooter>
                        <DialogClose>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                            <Button onClick={handleSubmit} type="submit">Save changes</Button>
                      </DialogFooter>
                    </DialogContent>
                </form>
                </Dialog>
        </div>
    );
}
