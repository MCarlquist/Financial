
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
import { Label } from "@/components/ui/label";


export const Route = createFileRoute('/auth/receipts')({
  component: RouteComponent,
})

function RouteComponent() {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (fileList && fileList.length > 0) {
          setFile(fileList[0]);
        } else {
          setFile(null);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
       event.preventDefault();
       console.log(file);
     };

    return (
        <div>
            <h3>Scan Receipts</h3>
            <Dialog>

                <DialogTrigger>
                    <Button variant="outline">Open Dialog</Button>
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
