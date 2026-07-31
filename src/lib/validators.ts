import { z } from "zod";

// Auth validation messages are emitted as keys, not prose: the server action
// swaps them for the user's locale via dict.auth.validation before rendering.
// Letters (any alphabet), spaces, apostrophes and hyphens — no digits.
const NAME_PATTERN = /^[\p{L}][\p{L}\s'’-]*$/u;

const nameField = z
  .string()
  .trim()
  .min(1, "nameRequired")
  .max(80)
  .regex(NAME_PATTERN, "nameLettersOnly");

export const SignupSchema = z
  .object({
    email: z.email("invalidEmail").trim().toLowerCase(),
    name: nameField,
    password: z.string().min(8, "passwordTooShort").max(200),
    passwordConfirm: z.string().min(1, "passwordConfirmRequired"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    error: "passwordsDontMatch",
    path: ["passwordConfirm"],
  });
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.email("invalidEmail").trim().toLowerCase(),
  password: z.string().min(1, "passwordRequired"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.email("invalidEmail").trim().toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z.string().min(8, "passwordTooShort").max(200),
    passwordConfirm: z.string().min(1, "passwordConfirmRequired"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    error: "passwordsDontMatch",
    path: ["passwordConfirm"],
  });

export const ShelfEnum = z.enum([
  "WANT_TO_READ",
  "READING",
  "READ",
  "ABANDONED",
]);
export type ShelfValue = z.infer<typeof ShelfEnum>;

export const AddBookSchema = z.object({
  olid: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(300),
  coverUrl: z.string().trim().url().optional().or(z.literal("")),
  shelf: ShelfEnum,
});

export const ManualAddBookSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(300),
  author: z.string().trim().min(1, "Author is required.").max(300),
  shelf: ShelfEnum,
});

export const MoveBookSchema = z.object({
  userBookId: z.string().trim().min(1),
  shelf: ShelfEnum,
});

export const RemoveBookSchema = z.object({
  userBookId: z.string().trim().min(1),
});

export const CreateClubSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const ClubIdSchema = z.object({
  clubId: z.string().trim().min(1),
});

export const ChallengeToDuelSchema = z.object({
  clubId: z.string().trim().min(1),
  opponentId: z.string().trim().min(1),
});

export const DuelIdSchema = z.object({
  duelId: z.string().trim().min(1),
});

export const SetClubBookSchema = z.object({
  clubId: z.string().trim().min(1),
  bookId: z.string().trim().min(1),
});

/** Adding a book to your own shelf and to the club in one step. */
export const AddClubBookSchema = z.object({
  clubId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(300),
});

export const UpdateProgressSchema = z
  .object({
    userBookId: z.string().trim().min(1),
    pagesRead: z.coerce.number().int().min(0).max(100000),
    totalPages: z.coerce.number().int().min(1).max(100000),
  })
  .refine((d) => d.pagesRead <= d.totalPages, {
    error: "Pages read can't exceed total pages.",
    path: ["pagesRead"],
  });

export const RatingSchema = z.object({
  userBookId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
});

export const ClearRatingSchema = z.object({
  userBookId: z.string().trim().min(1),
});

export const ReviewSchema = z.object({
  userBookId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const NotesSchema = z.object({
  userBookId: z.string().trim().min(1),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const YearlyGoalSchema = z.object({
  target: z.coerce.number().int().min(0).max(1000),
});

export const ClubCommentSchema = z.object({
  clubId: z.string().trim().min(1),
  body: z.string().trim().min(1, "Write something first.").max(2000),
  parentId: z.string().trim().min(1).optional().or(z.literal("")),
});

export const DeleteClubCommentSchema = z.object({
  clubId: z.string().trim().min(1),
  commentId: z.string().trim().min(1),
});

export const ClubScheduleSchema = z
  .object({
    clubId: z.string().trim().min(1),
    startDate: z.string().trim().optional().or(z.literal("")),
    dueDate: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (d) => !d.startDate || !d.dueDate || new Date(d.dueDate) >= new Date(d.startDate),
    { error: "Due date can't be before the start date.", path: ["dueDate"] },
  );
