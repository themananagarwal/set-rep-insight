import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

// Provision a new client profile (Admin action)
// Bypasses the strict signups and creates directly in Auth + Profiles using the Service Key
router.post("/provision", async (req, res) => {
    try {
        const { email, password, name, phone, role, trainerId, goal, weight, type } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // 1. Create User in Supabase Auth securely
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: role || "client" }
        });

        if (authError) throw authError;

        // Note: The handle_new_user trigger in the DB normally creates the profile
        // But we want to inject specific details like trainerId, weight, goal etc directly
        // So we update the generic profile immediately using admin privileges
        if (authData.user) {
            const { error: profileError } = await supabaseAdmin.from("profiles").update({
                trainer_id: trainerId,
                phone: phone || null,
                goal: goal || null,
                weight: weight ? parseFloat(weight) : null,
                // store client 'type' inside activity_level temporarily or we can rely on clientTypes DB schema (wait we didn't add clientTypes table, it's mock store right now! We'll just patch the DB if needed or keep it in the auth metadata)
            }).match({ id: authData.user.id });

            if (profileError) {
                console.error("Profile update immediately after creation failed:", profileError.message);
                // Non-fatal, return success for auth creation
            }
        }

        return res.status(200).json({ success: true, user: authData.user });
    } catch (err: any) {
        console.error("Provisioning Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Remove a client completely (Admin action)
router.delete("/:clientId", async (req, res) => {
    try {
        const { clientId } = req.params;
        
        // Deleting from auth.users cascades into public.profiles due to FK
        const { error } = await supabaseAdmin.auth.admin.deleteUser(clientId);

        if (error) throw error;
        
        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("Delete client error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

export default router;
