export type DuplicateCandidateUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
};

export type DuplicateReason = "EMAIL" | "MOBILE" | "EXACT_NAME" | "SIMILAR_NAME";

function normaliseText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalisePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("00353")) return `0${digits.slice(5)}`;
  if (digits.startsWith("353")) return `0${digits.slice(3)}`;
  return digits;
}

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

export function duplicateReasons(left: DuplicateCandidateUser, right: DuplicateCandidateUser) {
  const reasons: DuplicateReason[] = [];
  const leftEmail = left.email.trim().toLowerCase();
  const rightEmail = right.email.trim().toLowerCase();
  if (leftEmail && leftEmail === rightEmail) reasons.push("EMAIL");

  const leftMobile = normalisePhone(left.mobile);
  const rightMobile = normalisePhone(right.mobile);
  if (leftMobile.length >= 9 && leftMobile === rightMobile) reasons.push("MOBILE");

  const leftFirst = normaliseText(left.firstName);
  const rightFirst = normaliseText(right.firstName);
  const leftLast = normaliseText(left.lastName);
  const rightLast = normaliseText(right.lastName);
  if (leftFirst && leftLast && leftFirst === rightFirst && leftLast === rightLast) {
    reasons.push("EXACT_NAME");
  } else {
    const similarFirst = leftFirst.length >= 3 && rightFirst.length >= 3
      && editDistance(leftFirst, rightFirst) <= 1 && leftLast === rightLast;
    const similarLast = leftLast.length >= 3 && rightLast.length >= 3
      && editDistance(leftLast, rightLast) <= 1 && leftFirst === rightFirst;
    if (similarFirst || similarLast) reasons.push("SIMILAR_NAME");
  }
  return reasons;
}

export function findDuplicateCandidates<T extends DuplicateCandidateUser>(users: T[]) {
  const candidates: Array<{ lowerUser: T; higherUser: T; reasons: DuplicateReason[] }> = [];
  for (let leftIndex = 0; leftIndex < users.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < users.length; rightIndex += 1) {
      const first = users[leftIndex];
      const second = users[rightIndex];
      const lowerUser = first.id < second.id ? first : second;
      const higherUser = first.id < second.id ? second : first;
      const reasons = duplicateReasons(lowerUser, higherUser);
      if (reasons.length) candidates.push({ lowerUser, higherUser, reasons });
    }
  }
  return candidates;
}
