import { Note, NoteMessageEvent } from "webmidi";

// export type NoteOnMessage = Pick<NoteMessageEvent, "note">

export interface NoteOnMessage {
    note: Pick<Note, "name" | "number" | "octave">
}