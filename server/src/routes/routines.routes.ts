import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

// Assign a routine to a client securely on the backend
router.post("/assign", async (req, res) => {
    try {
        const { clientId, trainerRoutineId, authorId } = req.body;
        
        if (!clientId || !trainerRoutineId) {
            return res.status(400).json({ error: "clientId and trainerRoutineId are required" });
        }

        // Fetch the template routine from the db (if we had it in DB)
        // Note: For now, since trainerRoutines was mock, we assume req.body.routine 
        // contains the fully constructed JSON payload from frontend, OR we fetch it.
        const { routine } = req.body;
        if (!routine) {
            return res.status(400).json({ error: "routine object is required payload" });
        }

        // Using Supabase Admin to bypass RLS and definitively insert the routine assigned to user
        const { data, error } = await supabaseAdmin.from("routines").insert({
            user_id: clientId,
            author_id: authorId || null,
            name: routine.name,
            description: routine.description || null,
            rationale: routine.rationale || "Assigned by trainer",
            days: routine.days, // JSONB structure
            current_day_index: 0,
            start_date: Date.now(),
            last_modified: Date.now()
        }).select().single();

        if (error) throw error;
        
        return res.status(200).json({ success: true, routine: data });
    } catch (err: any) {
        console.error("Assign Routine Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Remove a routine from a client permanently
router.delete("/assign/:clientId/:routineId", async (req, res) => {
    try {
        const { clientId, routineId } = req.params;
        const { error } = await supabaseAdmin.from("routines")
            .delete()
            .match({ id: routineId, user_id: clientId });

        if (error) throw error;
        
        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("Remove Routine Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

export default router;
