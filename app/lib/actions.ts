// use server tells Next.js to only run this code on the server-side
"use server";

// 1. Import necessary libraries
import { sql } from '@vercel/postgres'; // For interacting with the PostgreSQL database
import { z } from 'zod';              // For schema validation
import { revalidatePath } from 'next/cache'; // For revalidating cached data
import { redirect } from 'next/navigation';  // For redirecting the user

// 2. Define form schemas for validation
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// 3. Asynchronous function for creating a new invoice
export async function createInvoice(formData: FormData) {
    // Validate form data using the CreateInvoice schema
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // Calculate amount in cents and get current date
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert invoice data into the database
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

    // Revalidate cached data and redirect to the invoices dashboard
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

// 4. Asynchronous function for updating an existing invoice
export async function updateInvoice(id: string, formData: FormData) {
    // Validate form data using the UpdateInvoice schema
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // Calculate amount in cents
    const amountInCents = amount * 100;

    // Update invoice data in the database
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

    // Revalidate cached data and redirect to the invoices dashboard
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// 5. Asynchronous function for updating an existing invoice
export async function deleteInvoice(id: string) {
    // SQL query deletes record by filtering using the id property
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    // re-fetch data on the invoices route to sync UI with database
    revalidatePath('/dashboard/invoices');
}
