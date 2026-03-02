import React, { useState } from 'react';
import { XCircle, Plus, Trash2, Save, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import ModelSelector from '../SGSST/ModelSelector';

export interface ExamQuestion {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
}

export interface Exam {
    title: string;
    description: string;
    questions: ExamQuestion[];
    passingScore: number;
    isEnabled: boolean;
}

interface ExamEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (exam: Exam) => void;
    initialExam?: Exam | null;
    title?: string;
}

export default function ExamEditorModal({ isOpen, onClose, onSave, initialExam, title = 'Editar Examen' }: ExamEditorModalProps) {
    const [exam, setExam] = useState<Exam>(() => {
        if (initialExam) {
            return {
                title: initialExam.title || '',
                description: initialExam.description || '',
                questions: initialExam.questions?.length ? initialExam.questions : [],
                passingScore: initialExam.passingScore || 70,
                isEnabled: initialExam.isEnabled !== undefined ? initialExam.isEnabled : false
            };
        }
        return {
            title: '',
            description: '',
            questions: [],
            passingScore: 70,
            isEnabled: false
        };
    });

    const { showToast } = useToastContext();
    const [isGeneratingExam, setIsGeneratingExam] = useState(false);
    const [examAIModel, setExamAIModel] = useState('gemini-3-flash-preview');

    if (!isOpen) return null;

    const handleGenerateExam = async () => {
        if (!exam.title.trim() && !exam.description.trim()) {
            showToast({ message: 'Ingresa un título o descripción tentativa para generar el examen.', status: 'warning' });
            return;
        }
        setIsGeneratingExam(true);
        try {
            const response = await axios.post('/api/training/admin/generate', {
                type: 'exam',
                prompt: exam.title || exam.description,
                modelName: examAIModel
            });
            if (response.data?.data) {
                const generatedExam = response.data.data;
                setExam(prev => ({
                    ...prev,
                    title: generatedExam.title || prev.title,
                    description: generatedExam.description || prev.description,
                    passingScore: generatedExam.passingScore || prev.passingScore,
                    questions: generatedExam.questions || prev.questions,
                    isEnabled: true
                }));
                showToast({ message: 'Examen autogenerado con éxito.', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error en generación AI. Verifica tu indicación.', status: 'error' });
        } finally {
            setIsGeneratingExam(false);
        }
    };

    const handleSave = () => {
        // Validate
        if (exam.isEnabled && exam.questions.length === 0) {
            alert('Para habilitar el examen, se debe agregar al menos una pregunta.');
            return;
        }

        const validQuestions = exam.questions.filter(q => q.questionText.trim() && q.options.length >= 2);
        if (exam.isEnabled && validQuestions.length !== exam.questions.length) {
            alert('Todas las preguntas deben tener texto y al menos 2 opciones si el examen está habilitado.');
            return;
        }

        onSave(exam);
    };

    const addQuestion = () => {
        setExam({
            ...exam,
            questions: [
                ...exam.questions,
                { questionText: '', options: ['', ''], correctOptionIndex: 0, explanation: '' }
            ]
        });
    };

    const removeQuestion = (idx: number) => {
        const newQuestions = [...exam.questions];
        newQuestions.splice(idx, 1);
        setExam({ ...exam, questions: newQuestions });
    };

    const updateQuestion = (idx: number, field: keyof ExamQuestion, value: any) => {
        const newQuestions = [...exam.questions];
        newQuestions[idx] = { ...newQuestions[idx], [field]: value };
        setExam({ ...exam, questions: newQuestions });
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...exam.questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
        setExam({ ...exam, questions: newQuestions });
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...exam.questions];
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: [...newQuestions[qIndex].options, ''] };
        setExam({ ...exam, questions: newQuestions });
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...exam.questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions.splice(oIndex, 1);

        let newCorrectIndex = newQuestions[qIndex].correctOptionIndex;
        if (newCorrectIndex === oIndex) newCorrectIndex = 0;
        else if (newCorrectIndex > oIndex) newCorrectIndex--;

        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions, correctOptionIndex: newCorrectIndex };
        setExam({ ...exam, questions: newQuestions });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden m-4 border border-gray-200 dark:border-gray-700">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-800/80 gap-4">
                    <div>
                        <h3 className="font-bold text-xl">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Configura las preguntas, opciones y reglas para este examen.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleGenerateExam}
                            disabled={isGeneratingExam || (!exam.title.trim() && !exam.description.trim())}
                            className="group flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generar Examen con IA (Basado en el Título/Descripción)"
                        >
                            {isGeneratingExam ? (
                                <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                Generar Examen
                            </span>
                        </button>
                        <ModelSelector
                            selectedModel={examAIModel}
                            onSelectModel={setExamAIModel}
                            disabled={isGeneratingExam}
                        />
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-2">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* General Settings */}
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                                <h4 className="font-medium">Habilitar Examen</h4>
                                <p className="text-sm text-gray-500">¿Deseas que los usuarios deban tomar este examen?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={exam.isEnabled}
                                    onChange={(e) => setExam({ ...exam, isEnabled: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Título del Examen (Visible para usuarios)</label>
                            <input
                                type="text"
                                value={exam.title}
                                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 outline-none focus:border-blue-500"
                                placeholder="Ej: Evaluación de Conocimientos Generales"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Descripción corta o Instrucciones</label>
                            <textarea
                                value={exam.description}
                                onChange={(e) => setExam({ ...exam, description: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 outline-none focus:border-blue-500 resize-y"
                                rows={2}
                                placeholder="Instrucciones para resolver el examen..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Calificación para aprobar (%)</label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={exam.passingScore}
                                onChange={(e) => setExam({ ...exam, passingScore: parseInt(e.target.value) || 0 })}
                                className="w-full md:w-1/3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg">Preguntas ({exam.questions.length})</h4>
                            <button
                                onClick={addQuestion}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" /> Agregar Pregunta
                            </button>
                        </div>

                        {exam.questions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <AlertCircle className="w-10 h-10 mb-2 text-gray-400" />
                                <p>No hay preguntas creadas para este examen todavía.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {exam.questions.map((q, qIndex) => (
                                    <div key={qIndex} className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        <button
                                            onClick={() => removeQuestion(qIndex)}
                                            className="absolute top-4 right-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-full transition-colors"
                                            title="Eliminar pregunta"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>

                                        <div className="pr-10 mb-4">
                                            <label className="block text-sm font-semibold mb-1 text-blue-600 dark:text-blue-400">Pregunta {qIndex + 1}</label>
                                            <input
                                                type="text"
                                                value={q.questionText}
                                                onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 outline-none focus:border-blue-500"
                                                placeholder="Ej: ¿Qué se debe hacer en caso de emergencia?"
                                            />
                                        </div>

                                        <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opciones y Respuesta Correcta</label>
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qIndex}`}
                                                        checked={q.correctOptionIndex === oIndex}
                                                        onChange={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                                        title="Marcar como respuesta correcta"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                        className={`flex-1 rounded border px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors ${q.correctOptionIndex === oIndex
                                                            ? 'border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-900/10'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50'
                                                            }`}
                                                        placeholder={`Opción ${oIndex + 1}`}
                                                    />
                                                    <button
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        disabled={q.options.length <= 2}
                                                        className={`p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${q.options.length <= 2 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addOption(qIndex)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1 font-medium"
                                            >
                                                <Plus className="w-3 h-3" /> Agregar opción
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Explicación <span className="text-gray-400 font-normal italic">(Opcional, se muestra si fallan)</span></label>
                                            <input
                                                type="text"
                                                value={q.explanation}
                                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm outline-none focus:border-gray-400"
                                                placeholder="Ej: La normativa indica que lo correcto es evacuar primero."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                    >
                        <Save className="w-5 h-5" />
                        Guardar Examen
                    </button>
                </div>
            </div>
        </div>
    );
}
