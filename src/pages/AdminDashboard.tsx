import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile, Routine } from '../lib/types';
import { useMockBackendStore } from '../lib/mockBackend';
import { useTrainerStore } from '../lib/store';
import { Users, BookOpen, Settings, LogOut, Plus, User as UserIcon, ArrowLeft, Activity, Calendar, X, Dices, Dumbbell, Pencil, Search, Trash2, CheckCircle, FolderOpen, Copy } from 'lucide-react';
import { ProgramBuilder } from '../components/ProgramBuilder';

export default function AdminDashboard() {
    const { user, logout, switchViewMode } = useAuth();
    const [activeTab, setActiveTab] = useState<'clients' | 'trainers' | 'programs' | 'library' | 'settings'>('clients');
    const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState<UserProfile | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

    // Master admin is the top-level admin with no trainerId
    const isMasterAdmin = !user?.trainerId;

    // Form State
    const [newClient, setNewClient] = useState({
        name: '', email: '', phone: '', password: '', height: '', weight: '', goal: 'hypertrophy', role: 'client' as 'client' | 'admin', type: 'gym' as 'gym' | 'physio'
    });

    const users = useMockBackendStore(state => state.users);
    const clients = user ? users.filter(u => u.role === "client" && u.trainerId === user.id) : [];
    const trainers = user ? users.filter(u => u.role === "admin" && u.trainerId === user.id) : [];
    const clientRoutines = useMockBackendStore(state => state.routinesByUserId);
    const assignRoutine = useMockBackendStore(state => state.assignRoutineToClient);
    const addClient = useMockBackendStore(state => state.addUser);
    const deleteUser = useMockBackendStore(state => state.deleteUser);
    const updateUser = useMockBackendStore(state => state.updateUser);
    const setClientTypeMock = useMockBackendStore(state => state.setClientType);
    const clientTypes = useMockBackendStore(state => state.clientTypes);
    const globalExercises = useMockBackendStore(state => state.globalExercises);
    const addGlobalExercise = useMockBackendStore(state => state.addGlobalExercise);
    const updateGlobalExercise = useMockBackendStore(state => state.updateGlobalExercise);
    const deleteGlobalExercise = useMockBackendStore(state => state.deleteGlobalExercise);
    const { exercises: clientExercises } = useTrainerStore();

    const trainerRoutines = useMockBackendStore(state => state.trainerRoutines);
    const addTrainerRoutine = useMockBackendStore(state => state.addTrainerRoutine);
    const deleteTrainerRoutine = useMockBackendStore(state => state.deleteTrainerRoutine);
    const duplicateTrainerRoutine = useMockBackendStore(state => state.duplicateTrainerRoutine);
    const assignTrainerRoutineToClient = useMockBackendStore(state => state.assignTrainerRoutineToClient);

    const physioEvaluations = useMockBackendStore(state => state.physioEvaluations);
    const physioSessionNotes = useMockBackendStore(state => state.physioSessionNotes);
    const savePhysioEvaluation = useMockBackendStore(state => state.savePhysioEvaluation);
    const addPhysioSessionNote = useMockBackendStore(state => state.addPhysioSessionNote);

    // Programs State
    const [progSearch, setProgSearch] = useState('');
    const [progFilter, setProgFilter] = useState<'all' | 'template' | 'client-specific'>('all');
    const [isAddingProgram, setIsAddingProgram] = useState(false);
    const [progForm, setProgForm] = useState({ name: '', description: '', scope: 'template' as 'template' | 'client-specific', assignedTo: '' });
    const [selectedProgramToAssign, setSelectedProgramToAssign] = useState<string | null>(null);
    const [editingRoutine, setEditingRoutine] = useState<import('../lib/types').TrainerRoutine | null>(null);

    // Library State
    const [libSearch, setLibSearch] = useState('');
    const [libFilter, setLibFilter] = useState<'all' | 'system' | 'global'>('all');
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [editingExercise, setEditingExercise] = useState<string | null>(null);
    const [exForm, setExForm] = useState({ name: '', muscle: '', trackingType: 'reps' as 'reps' | 'time' });

    // Merge system exercises + global exercises for the admin library view
    const adminLibrary = useMemo(() => {
        const systemExs = clientExercises.map(e => ({ ...e, scope: e.scope || 'system' as const }));
        return [
            ...systemExs,
            ...globalExercises,
        ].filter(e => {
            const q = libSearch.toLowerCase();
            const matchSearch = !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q);
            const matchFilter = libFilter === 'all' || e.scope === libFilter;
            return matchSearch && matchFilter;
        });
    }, [clientExercises, globalExercises, libSearch, libFilter]);

    const handleAddGlobalExercise = () => {
        if (!exForm.name.trim() || !exForm.muscle.trim() || !user) return;
        addGlobalExercise({
            name: exForm.name.trim(),
            muscle: exForm.muscle.trim(),
            type: 'isolation',
            trackingType: exForm.trackingType,
        }, user.id);
        setExForm({ name: '', muscle: '', trackingType: 'reps' });
        setIsAddingExercise(false);
    };

    const handleUpdateGlobalExercise = (id: string) => {
        updateGlobalExercise(id, { name: exForm.name.trim(), muscle: exForm.muscle.trim(), trackingType: exForm.trackingType });
        setEditingExercise(null);
        setExForm({ name: '', muscle: '', trackingType: 'reps' });
    };

    const [evalForm, setEvalForm] = useState({ symptoms: '', painPoints: '', preliminaryDiagnosis: '', finalDiagnosis: '' });
    const [noteForm, setNoteForm] = useState({ patientFeedback: '', treatmentDone: '', remarks: '' });
    const [isSavingEval, setIsSavingEval] = useState(false);

    const handleAddClientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const finalUser = addClient({
            email: newClient.email.toLowerCase(),
            phone: newClient.phone,
            password: newClient.password,
            role: newClient.role,
            trainerId: user.id,
            name: newClient.name,
            gender: "male", // default for mock
            weight: Number(newClient.weight) || undefined,
            height: Number(newClient.height) || undefined,
            goal: newClient.goal as any,
            activityLevel: "active",
            type: newClient.type,
        });
        if (newClient.role === 'client') {
            setClientTypeMock(finalUser.id, newClient.type);
        }
        setIsAddingClient(false);
        setNewClient({ name: '', email: '', phone: '', password: '', height: '', weight: '', goal: 'hypertrophy', role: 'client', type: 'gym' });
    };

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        const pass = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setNewClient(prev => ({ ...prev, password: pass }));
    };

    const openEditTrainer = (trainer: UserProfile) => {
        setEditingTrainer(trainer);
        setEditForm({ name: trainer.name, email: trainer.email, phone: trainer.phone || '' });
    };

    const handleEditTrainerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTrainer) return;
        updateUser(editingTrainer.id, {
            name: editForm.name,
            email: editForm.email.toLowerCase(),
            phone: editForm.phone,
        });
        setEditingTrainer(null);
    };

    const handleAssignMockRoutine = (clientId: string) => {
        const mockRoutine: Routine = {
            id: `routine-${Date.now()}`,
            name: "Hypertrophy Push/Pull/Legs",
            rationale: "Assigned by Trainer for maximizing muscle growth.",
            days: [
                { id: "day1", name: "Push Day", exercises: [] }
            ],
            currentDayIndex: 0,
            startDate: Date.now(),
            lastModified: Date.now(),
            authorId: user?.id,
        };
        assignRoutine(clientId, mockRoutine);
    };

    if (!user || user.role !== 'admin') {
        return <div className="p-8 text-white">Access Denied: Admins Only</div>;
    }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 flex flex-col bg-zinc-950">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold tracking-tight text-red-500">Trainer Portal</h1>
                    <p className="text-sm text-zinc-400 mt-1">{user.name}</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('clients'); setSelectedClient(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'clients' ? 'bg-red-600 text-white font-medium shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={20} />
                        <span className="font-medium">My Clients</span>
                    </button>
                    {isMasterAdmin && (
                        <button
                            onClick={() => { setActiveTab('trainers'); setSelectedClient(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'trainers' ? 'bg-red-600 text-white font-medium shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <UserIcon size={20} />
                            <span className="font-medium">My Staff</span>
                        </button>
                    )}
                    <button
                        onClick={() => { setActiveTab('programs'); setSelectedClient(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'programs' ? 'bg-red-600 text-white font-medium shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FolderOpen size={20} />
                        <span className="font-medium">Programs</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('library'); setSelectedClient(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'library' ? 'bg-red-600 text-white font-medium shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <BookOpen size={20} />
                        <span className="font-medium">Workout Library</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('settings'); setSelectedClient(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'settings' ? 'bg-red-500/10 text-red-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                        }`}
                    >
                        <Settings size={20} />
                        <span className="font-medium">Settings</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="pt-6 border-t border-white/5 space-y-2">
                        <button
                            onClick={() => switchViewMode("client")}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors text-left"
                        >
                            <Dumbbell size={20} />
                            <span className="font-medium">My Training</span>
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-black p-8">
                {activeTab === 'clients' && !selectedClient && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">My Clients</h2>
                                <p className="text-zinc-400">Manage your active clients and their programs.</p>
                            </div>
                            <button
                                onClick={() => setIsAddingClient(true)}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                            >
                                <Plus size={20} />
                                Add Client
                            </button>
                        </div>

                        {clients.length === 0 ? (
                            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-12 text-center">
                                <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                                <h3 className="text-xl font-bold mb-2">No Clients Yet</h3>
                                <p className="text-zinc-400 max-w-sm mx-auto">
                                    You haven't added any clients to your roster yet. Click 'Add Client' to provision a new account.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {clients.map(client => (
                                    <div 
                                        key={client.id} 
                                        onClick={() => setSelectedClient(client)}
                                        className="bg-zinc-950 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:border-red-500/30 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 group-hover:text-red-500 transition-colors">
                                                <UserIcon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">{client.name}</h3>
                                                <p className="text-sm text-zinc-400">{client.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 text-sm text-zinc-400">
                                             <div className="text-right">
                                                <p className="font-medium text-white mb-0.5">{client.goal || "N/A"}</p>
                                                <p>Goal</p>
                                            </div>
                                            <div className="w-[1px] h-8 bg-zinc-800" />
                                            <div className="text-right">
                                                <p className="font-medium text-white mb-0.5">{(clientRoutines[client.id] || []).length}</p>
                                                <p>Programs</p>
                                            </div>
                                             <button className="ml-4 px-4 py-2 bg-zinc-900 group-hover:bg-red-600 rounded-xl font-bold text-white transition-colors">
                                                 Manage
                                             </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'clients' && selectedClient && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Back Button */}
                        <button 
                            onClick={() => setSelectedClient(null)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Clients
                        </button>

                        <div className="flex items-center justify-between bg-zinc-950 border border-white/10 p-8 rounded-3xl">
                             <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500">
                                    <UserIcon size={40} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight mb-1">{selectedClient.name}</h2>
                                    <p className="text-zinc-400">{selectedClient.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-center">
                                <div className="bg-zinc-900 px-6 py-3 rounded-2xl">
                                    <p className="text-zinc-500 text-sm mb-1 font-medium">Goal</p>
                                    <p className="text-xl font-bold text-white capitalize">{selectedClient.goal || "None"}</p>
                                </div>
                                <div className="bg-zinc-900 px-6 py-3 rounded-2xl">
                                    <p className="text-zinc-500 text-sm mb-1 font-medium">Weight</p>
                                    <p className="text-xl font-bold text-white">{selectedClient.weight ? `${selectedClient.weight}kg` : "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── GYM MODULE RENDER ── */}
                        {(!clientTypes[selectedClient.id] || clientTypes[selectedClient.id] === 'gym') && (
                        <>
                        {/* Assigned Programs Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <Calendar className="text-red-500" /> Assigned Programs
                                </h3>
                                <button 
                                    onClick={() => handleAssignMockRoutine(selectedClient.id)}
                                    className="px-4 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                                >
                                    Assign Program
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {(clientRoutines[selectedClient.id] || []).length === 0 ? (
                                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 text-center">
                                        <p className="text-zinc-400">No programs assigned yet.</p>
                                    </div>
                                ) : (
                                    (clientRoutines[selectedClient.id] || []).map(routine => (
                                        <div key={routine.id} className="bg-zinc-950 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">{routine.name}</h4>
                                                <p className="text-sm text-zinc-400">{routine.rationale}</p>
                                            </div>
                                            <div className="text-sm font-medium text-red-500 bg-red-500/10 px-4 py-1.5 rounded-full">
                                                Active Template
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        {/* Recent Activity (Mock) */}
                        <div>
                            <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                <Activity className="text-red-500" /> Recent Activity
                            </h3>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 text-center">
                                <p className="text-zinc-500">Client's recent workout logs will appear here.</p>
                            </div>
                        </div>
                        </>
                        )}
                        
                        {/* ── PHYSIO MODULE RENDER ── */}
                        {clientTypes[selectedClient.id] === 'physio' && (
                            <div className="space-y-8 mt-8">
                                {/* EVALUATION FORM */}
                                <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                                            <Activity size={24} />
                                            Medical Evaluation
                                        </h3>
                                        {isSavingEval ? (
                                            <span className="text-blue-400 font-bold animate-pulse text-sm">Saving...</span>
                                        ) : (
                                            <button 
                                                onClick={async () => {
                                                    setIsSavingEval(true);
                                                    savePhysioEvaluation(selectedClient.id, { clientId: selectedClient.id, ...evalForm });
                                                    await new Promise(r => setTimeout(r, 600)); // fake delay
                                                    setIsSavingEval(false);
                                                }}
                                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold transition-colors"
                                            >
                                                Save Evaluation
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Symptoms</label>
                                            <textarea 
                                                value={evalForm.symptoms || physioEvaluations[selectedClient.id]?.symptoms || ''} 
                                                onChange={e => setEvalForm({...evalForm, symptoms: e.target.value})} 
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[100px]" 
                                                placeholder="Describe symptoms..." 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Pain Points</label>
                                            <textarea 
                                                value={evalForm.painPoints || physioEvaluations[selectedClient.id]?.painPoints || ''} 
                                                onChange={e => setEvalForm({...evalForm, painPoints: e.target.value})} 
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[100px]" 
                                                placeholder="Where does it hurt?" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Preliminary Diagnosis</label>
                                            <textarea 
                                                value={evalForm.preliminaryDiagnosis || physioEvaluations[selectedClient.id]?.preliminaryDiagnosis || ''} 
                                                onChange={e => setEvalForm({...evalForm, preliminaryDiagnosis: e.target.value})} 
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[100px]" 
                                                placeholder="Initial thoughts..." 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Final Diagnosis</label>
                                            <textarea 
                                                value={evalForm.finalDiagnosis || physioEvaluations[selectedClient.id]?.finalDiagnosis || ''} 
                                                onChange={e => setEvalForm({...evalForm, finalDiagnosis: e.target.value})} 
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[100px]" 
                                                placeholder="Formal diagnosis..." 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SESSION NOTES */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold flex items-center gap-2">
                                            <BookOpen className="text-zinc-300" />
                                            Visit Notes
                                        </h3>
                                    </div>
                                    
                                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 mb-6 space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-zinc-500 uppercase">Patient Feedback</label>
                                                <input type="text" value={noteForm.patientFeedback} onChange={e => setNoteForm({...noteForm, patientFeedback: e.target.value})} className="w-full bg-zinc-950 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="How do they feel today?" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-zinc-500 uppercase">Treatment Done</label>
                                                <input type="text" value={noteForm.treatmentDone} onChange={e => setNoteForm({...noteForm, treatmentDone: e.target.value})} className="w-full bg-zinc-950 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Exercises, adjustments..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-zinc-500 uppercase">Remarks</label>
                                                <div className="flex gap-2">
                                                    <input type="text" value={noteForm.remarks} onChange={e => setNoteForm({...noteForm, remarks: e.target.value})} className="flex-1 bg-zinc-950 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Notes for next time" />
                                                    <button 
                                                        onClick={() => {
                                                            if (!noteForm.treatmentDone) return;
                                                            addPhysioSessionNote({ clientId: selectedClient.id, date: Date.now(), ...noteForm });
                                                            setNoteForm({ patientFeedback: '', treatmentDone: '', remarks: '' });
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 font-bold text-sm transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {physioSessionNotes.filter(n => n.clientId === selectedClient.id).sort((a,b) => b.date - a.date).map(note => (
                                            <div key={note.id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                    <span className="text-xs font-bold text-blue-400 capitalize">{new Date(note.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mt-2">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Feedback</p>
                                                        <p className="text-sm text-zinc-300">{note.patientFeedback || '--'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Treatment</p>
                                                        <p className="text-sm text-white">{note.treatmentDone}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Remarks</p>
                                                        <p className="text-sm text-zinc-400">{note.remarks || '--'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {physioSessionNotes.filter(n => n.clientId === selectedClient.id).length === 0 && (
                                            <p className="text-zinc-600 italic text-center text-sm py-4">No session notes recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'trainers' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">My Staff</h2>
                                <p className="text-zinc-400">Trainers who report to your master account.</p>
                            </div>
                            <button
                                onClick={() => setIsAddingClient(true)}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                            >
                                <Plus size={20} />
                                <span>Add Trainer</span>
                            </button>
                        </div>

                        {trainers.length === 0 ? (
                            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-12 text-center">
                                <Users size={48} className="mx-auto mb-4 text-zinc-600" />
                                <h3 className="text-xl font-bold mb-2">No trainers yet</h3>
                                <p className="text-zinc-400 max-w-md mx-auto">
                                    You haven't provisioned any subordinate trainer accounts.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trainers.map(trainer => (
                                    <div key={trainer.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 hover:border-red-500/50 transition-all flex flex-col h-full group relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center font-bold text-xl border border-red-500/30">
                                                {trainer.name.charAt(0)}
                                            </div>
                                            <div className="text-xs font-semibold px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                                                Trainer
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold mb-1">{trainer.name}</h3>
                                        <p className="text-zinc-400 text-sm mb-6 flex-1">{trainer.email}</p>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openEditTrainer(trainer)}
                                                className="flex-1 py-2.5 bg-zinc-800 hover:bg-blue-600/20 hover:text-blue-400 text-zinc-300 font-medium rounded-xl transition-colors border border-transparent hover:border-blue-500/30 text-sm flex items-center justify-center gap-2"
                                            >
                                                <Pencil size={15} />
                                                <span>Edit</span>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to permanently revoke access for ${trainer.name}?`)) {
                                                        deleteUser(trainer.id);
                                                    }
                                                }}
                                                className="flex-1 py-2.5 bg-zinc-800 hover:bg-red-600/20 hover:text-red-500 text-zinc-300 font-medium rounded-xl transition-colors border border-transparent hover:border-red-500/30 text-sm flex items-center justify-center gap-2"
                                            >
                                                <X size={15} />
                                                <span>Revoke</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'programs' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        {editingRoutine ? (
                            <ProgramBuilder routine={editingRoutine} onClose={() => setEditingRoutine(null)} />
                        ) : (
                            <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-1">Programs</h2>
                                <p className="text-zinc-400 text-sm">Create templates, manage client-specific routines, and assign them.</p>
                            </div>
                            <button
                                onClick={() => setIsAddingProgram(true)}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                            >
                                <Plus size={18} /> New Program
                            </button>
                        </div>

                        {/* Search + Filter */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search programs..."
                                    value={progSearch}
                                    onChange={e => setProgSearch(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
                                {(['all', 'template', 'client-specific'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setProgFilter(f)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                                            progFilter === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >{f === 'client-specific' ? 'Client Specific' : f}</button>
                                ))}
                            </div>
                        </div>

                        {/* Add Program Form */}
                        {isAddingProgram && (
                            <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 space-y-4">
                                <h3 className="font-bold text-white">Create New Program</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Program Name *" value={progForm.name}
                                        onChange={e => setProgForm(s => ({ ...s, name: e.target.value }))}
                                        className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                                    />
                                    <select
                                        value={progForm.scope}
                                        onChange={e => setProgForm(s => ({ ...s, scope: e.target.value as 'template' | 'client-specific' }))}
                                        className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                                    >
                                        <option value="template">Template (Reusable)</option>
                                        <option value="client-specific">Client-Specific</option>
                                    </select>
                                    <input
                                        type="text" placeholder="Description (Optional)" value={progForm.description}
                                        onChange={e => setProgForm(s => ({ ...s, description: e.target.value }))}
                                        className="col-span-2 bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                                    />
                                    {progForm.scope === 'client-specific' && (
                                        <select
                                            value={progForm.assignedTo}
                                            onChange={e => setProgForm(s => ({ ...s, assignedTo: e.target.value }))}
                                            className="col-span-2 bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                                        >
                                            <option value="">Select a Client To Build For</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (!progForm.name.trim() || !user) return;
                                            if (progForm.scope === 'client-specific' && !progForm.assignedTo) return;
                                            addTrainerRoutine({
                                                name: progForm.name.trim(),
                                                description: progForm.description.trim(),
                                                scope: progForm.scope,
                                                assignedTo: progForm.scope === 'client-specific' ? progForm.assignedTo : undefined,
                                                trainerId: user.id,
                                                days: []
                                            });
                                            setIsAddingProgram(false);
                                            setProgForm({ name: '', description: '', scope: 'template', assignedTo: '' });
                                        }} 
                                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
                                    >Save Draft Program</button>
                                    <button onClick={() => setIsAddingProgram(false)} className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* List Programs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trainerRoutines
                                .filter(r => (progFilter === 'all' || r.scope === progFilter) && (!progSearch || r.name.toLowerCase().includes(progSearch.toLowerCase())))
                                .map(routine => {
                                    const assignedClientInfo = clients.find(c => c.id === routine.assignedTo);
                                    
                                    return (
                                        <div key={routine.id} className="bg-zinc-900 border border-white/10 p-5 rounded-2xl group hover:border-red-500/30 transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-lg font-bold text-white leading-tight">{routine.name}</h3>
                                                    <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-1 rounded border ${routine.scope === 'template' ? 'text-zinc-400 border-white/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                                                        {routine.scope}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-400 text-xs mb-4 line-clamp-2">{routine.description || "No description provided."}</p>
                                                {routine.scope === 'client-specific' && assignedClientInfo && (
                                                    <div className="flex items-center gap-2 mb-4 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 w-fit">
                                                        <UserIcon size={12} className="text-zinc-500" />
                                                        <span className="text-xs text-zinc-300">{assignedClientInfo.name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setEditingRoutine(routine)}
                                                        title="Edit Program Builder"
                                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    {user && (
                                                        <button 
                                                            onClick={() => duplicateTrainerRoutine(routine.id, user.id)}
                                                            title="Duplicate Program"
                                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                        >
                                                            <Copy size={18} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteTrainerRoutine(routine.id)}
                                                        title="Delete Program"
                                                        className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => {
                                                        if (routine.scope === 'client-specific' && routine.assignedTo) {
                                                            assignTrainerRoutineToClient(routine.id, routine.assignedTo);
                                                            alert('Assigned directly to ' + assignedClientInfo?.name);
                                                        } else {
                                                            setSelectedProgramToAssign(routine.id);
                                                        }
                                                    }}
                                                    className="text-xs font-bold bg-white text-black px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors"
                                                >
                                                    {routine.scope === 'client-specific' ? 'Push to App' : 'Assign'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            {trainerRoutines.length === 0 && !isAddingProgram && (
                                <div className="col-span-2 py-16 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <FolderOpen size={40} className="mx-auto text-zinc-600 mb-3" />
                                    <p className="text-zinc-500 text-sm">You haven't built any programs yet.</p>
                                </div>
                            )}
                        </div>
                            </>
                        )}
                    </div>
                )}

                {/* Assignment Modal */}
                {selectedProgramToAssign && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                        <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
                             <button onClick={() => setSelectedProgramToAssign(null)} className="absolute top-6 right-6 text-zinc-500"><X size={20}/></button>
                             <h3 className="text-xl font-bold mb-4">Assign Template</h3>
                             <p className="text-sm text-zinc-400 mb-6">Select a client to push this program to their training app.</p>
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                {clients.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => {
                                            assignTrainerRoutineToClient(selectedProgramToAssign, c.id);
                                            setSelectedProgramToAssign(null);
                                        }}
                                        className="w-full text-left px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors border border-transparent hover:border-red-500/30"
                                    >
                                        <p className="font-bold">{c.name}</p>
                                        <p className="text-xs text-zinc-500">{c.email}</p>
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-1">Exercise Library</h2>
                                <p className="text-zinc-400 text-sm">System exercises are read-only. Add your own global exercises visible to all clients.</p>
                            </div>
                            <button
                                onClick={() => { setIsAddingExercise(true); setExForm({ name: '', muscle: '', trackingType: 'reps' }); }}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                            >
                                <Plus size={18} /> Add Exercise
                            </button>
                        </div>

                        {/* Search + Filter */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search exercises..."
                                    value={libSearch}
                                    onChange={e => setLibSearch(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
                                {(['all', 'system', 'global'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setLibFilter(f)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                                            libFilter === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >{f === 'global' ? 'Your Exercises' : f}</button>
                                ))}
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex gap-4 text-xs text-zinc-500">
                            <span>📚 {adminLibrary.filter(e => e.scope !== 'global').length} System</span>
                            <span>✨ {globalExercises.length} Added by You</span>
                            <span>🔍 {adminLibrary.length} shown</span>
                        </div>

                        {/* Add Exercise Form */}
                        {isAddingExercise && (
                            <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 space-y-4">
                                <h3 className="font-bold text-white">Add Global Exercise</h3>
                                <p className="text-xs text-zinc-400">This exercise will be visible to <strong className="text-red-400">all clients</strong> in their workout library.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text" placeholder="Exercise name *" value={exForm.name}
                                        onChange={e => setExForm(s => ({ ...s, name: e.target.value }))}
                                        className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 col-span-1"
                                    />
                                    <input
                                        type="text" placeholder="Muscle group *" value={exForm.muscle}
                                        onChange={e => setExForm(s => ({ ...s, muscle: e.target.value }))}
                                        className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                                    />
                                    <select
                                        value={exForm.trackingType}
                                        onChange={e => setExForm(s => ({ ...s, trackingType: e.target.value as 'reps' | 'time' }))}
                                        className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                                    >
                                        <option value="reps">Reps Based</option>
                                        <option value="time">Time Based</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddGlobalExercise} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">Add to Library</button>
                                    <button onClick={() => setIsAddingExercise(false)} className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* Exercise List */}
                        <div className="space-y-2">
                            {adminLibrary.length === 0 ? (
                                <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <BookOpen size={40} className="mx-auto text-zinc-600 mb-3" />
                                    <p className="text-zinc-500 text-sm">No exercises match your search.</p>
                                </div>
                            ) : adminLibrary.map(ex => (
                                <div key={ex.id} className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-xl px-5 py-4 group hover:border-white/10 transition-all">
                                    {editingExercise === ex.id ? (
                                        <div className="flex-1 grid grid-cols-3 gap-3 mr-3">
                                            <input value={exForm.name} onChange={e => setExForm(s => ({ ...s, name: e.target.value }))} className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
                                            <input value={exForm.muscle} onChange={e => setExForm(s => ({ ...s, muscle: e.target.value }))} className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
                                            <select value={exForm.trackingType} onChange={e => setExForm(s => ({ ...s, trackingType: e.target.value as 'reps' | 'time' }))} className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500/50">
                                                <option value="reps">Reps</option>
                                                <option value="time">Time</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ ex.scope === 'global' ? 'bg-red-500' : 'bg-zinc-600' }`} />
                                            <div>
                                                <p className="text-white font-medium text-sm">{ex.name}</p>
                                                <p className="text-zinc-500 text-xs">{ex.muscle} · {ex.trackingType === 'time' ? '⏱ Time' : '🔁 Reps'}</p>
                                            </div>
                                            {ex.scope === 'global' && (
                                                <span className="ml-auto mr-4 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Global</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {ex.scope === 'global' && editingExercise === ex.id ? (
                                            <>
                                                <button onClick={() => handleUpdateGlobalExercise(ex.id)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"><CheckCircle size={16} /></button>
                                                <button onClick={() => setEditingExercise(null)} className="p-2 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors"><X size={16} /></button>
                                            </>
                                        ) : ex.scope === 'global' ? (
                                            <>
                                                <button onClick={() => { setEditingExercise(ex.id); setExForm({ name: ex.name, muscle: ex.muscle, trackingType: ex.trackingType || 'reps' }); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"><Pencil size={16} /></button>
                                                <button onClick={() => deleteGlobalExercise(ex.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </>
                                        ) : (
                                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest pr-1">System</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                 {activeTab === 'settings' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Settings</h2>
                                <p className="text-zinc-400">Manage your trainer profile.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            {isAddingClient && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl w-full max-w-xl shadow-2xl relative my-8">
                        <button 
                            onClick={() => setIsAddingClient(false)}
                            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Onboard New Client</h2>
                            <p className="text-zinc-400">Fill out their starting metrics and create their portal access.</p>
                        </div>

                        <form onSubmit={handleAddClientSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Full Name *</label>
                                <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" placeholder="John Doe" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Account Type *</label>
                                    <select required value={newClient.role} onChange={e => setNewClient({...newClient, role: e.target.value as any})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer">
                                        <option value="client">Client</option>
                                        <option value="admin">Trainer / Admin</option>
                                    </select>
                                </div>
                                {newClient.role === 'client' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Client Type *</label>
                                        <select required value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value as 'gym'|'physio'})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer">
                                            <option value="gym">Gym Client</option>
                                            <option value="physio">Physiotherapy Client</option>
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Goal *</label>
                                    <select required value={newClient.goal} onChange={e => setNewClient({...newClient, goal: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer">
                                        <option value="hypertrophy">Hypertrophy (Build Muscle)</option>
                                        <option value="strength">Strength</option>
                                        <option value="fat_loss">Fat Loss</option>
                                        <option value="endurance">Endurance</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Email Address *</label>
                                    <input required type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" placeholder="client@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Phone Number</label>
                                    <input type="tel" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Starting Weight (kg)</label>
                                    <input type="number" step="0.1" value={newClient.weight} onChange={e => setNewClient({...newClient, weight: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" placeholder="80" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Height (cm)</label>
                                    <input type="number" value={newClient.height} onChange={e => setNewClient({...newClient, height: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" placeholder="180" />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <label className="text-sm font-medium text-zinc-400">Temporary Password *</label>
                                <div className="flex gap-2">
                                    <input required type="text" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 font-mono" placeholder="Enter or generate..." />
                                    <button type="button" onClick={generatePassword} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors flex items-center justify-center" aria-label="Auto-generate password" title="Auto-generate password">
                                        <Dices size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">The client will use this to log in. They can change it later.</p>
                            </div>

                            <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors mt-8">
                                Provision Account
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Trainer Modal */}
            {editingTrainer && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setEditingTrainer(null)}
                            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Edit Trainer</h2>
                            <p className="text-zinc-400">Update details for {editingTrainer.name}.</p>
                        </div>

                        <form onSubmit={handleEditTrainerSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Full Name *</label>
                                <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Email Address *</label>
                                <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Phone Number</label>
                                <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50" placeholder="+1 (555) 000-0000" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors mt-4">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
