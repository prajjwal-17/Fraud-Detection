import { Case } from "../models/Case.js";

export const createOrUpdateCase = async ({
  transaction,
  sender,
  finalRiskScore,
  mlScore,
  decision,
  priority
}) => {
  if (!["SUSPICIOUS", "FRAUD"].includes(decision)) {
    return null;
  }

  return Case.findOneAndUpdate(
    { transactionId: transaction._id },
    {
      $set: {
        userId: sender._id,
        latestRiskScore: finalRiskScore,
        mlScore,
        decision,
        priority
      },
      $setOnInsert: {
        status: "OPEN"
      }
    },
    { upsert: true, new: true }
  );
};

export const appendCaseNote = async ({ caseId, author, message }) =>
  Case.findByIdAndUpdate(
    caseId,
    {
      $push: {
        notes: {
          authorId: author._id,
          authorName: author.name,
          message
        }
      }
    },
    { new: true }
  );

