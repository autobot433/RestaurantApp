"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { requireInt, assert, cleanString, ValidationError } from "@/lib/security/validation";

export default function ReservationForm() {
  const router = useRouter();
  const [partySize, setPartySize] = useState(2);
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      requireInt(partySize, { min: 1, max: 20, field: "party size" });
      assert(when, "Choose a date and time.");
      const date = new Date(when);
      assert(!Number.isNaN(date.getTime()) && date.getTime() > Date.now(), "Choose a future time.");
      if (note) cleanString(note, { max: 300, field: "note" });

      setLoading(true);
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          party_size: Number(partySize),
          reserved_for: date.toISOString(),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not book.");
      toast.success("Reservation requested.");
      setNote("");
      setWhen("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ValidationError ? err.message : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="party">Party size</label>
        <select
          id="party"
          className="input"
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="when">Date & time</label>
        <input
          id="when"
          className="input"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="note">Notes (optional)</label>
        <textarea
          id="note"
          className="input"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Allergies, celebrations, seating preferences…"
        />
      </div>
      <button className="btn btn-gold btn-block" disabled={loading}>
        {loading ? <span className="spinner" /> : "Request reservation"}
      </button>
    </form>
  );
}
