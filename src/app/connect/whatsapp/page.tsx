import Link from "next/link";

const WHATSAPP_INVITATION = "https://chat.whatsapp.com/EasGkcjJzQMCba9b9iwU3l?s=cl&p=a&mlu=4&ilr=4&iam=2";

export default function WhatsAppConnectPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold">Join the WhatsApp Group</h1>
        <p className="mt-4 text-slate-600">
          Join the Perfect XV WhatsApp group to connect with other participants.
          Joining is optional and does not register you for a competition.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 px-4 py-4 text-left">
          <h2 className="font-semibold">Please introduce yourself when you join</h2>
          <p className="mt-2 text-sm text-slate-600">
            After joining the WhatsApp group, please send a short message with your
            first name and surname so other members know who you are.
            This does not change your WhatsApp profile name.
          </p>
        </div>
        <div className="mx-auto mt-7 max-w-sm rounded-xl border border-slate-200 bg-white p-3">
          <img
            src="/images/whatsapp-group-qr.svg"
            alt="QR code for the Perfect XV WhatsApp group invitation"
            width={350}
            height={350}
            className="block h-auto w-full"
          />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          On a computer, scan the code with your phone. If you are already using your phone,
          tap the button below instead.
        </p>
        <a
          href={WHATSAPP_INVITATION}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-800"
        >
          Join the WhatsApp Group
        </a>
        <p className="mt-5 text-xs text-slate-500">
          WhatsApp will ask you to confirm joining. Other group members may see your phone
          number and WhatsApp profile details.
        </p>
        <div className="mt-7">
          <Link href="/" className="text-sm font-medium text-blue-700 underline">
            Return to Perfect XV
          </Link>
        </div>
      </div>
    </main>
  );
}
