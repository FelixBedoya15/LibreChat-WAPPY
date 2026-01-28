import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { Eye, EyeOff } from 'lucide-react';
import {
    OGDialog,
    OGDialogContent,
    OGDialogTitle,
    OGDialogTrigger,
    Button,
    Label,
    Input,
    useToastContext,
} from '@librechat/client';
import { useAuthContext, useLocalize } from '~/hooks';
import store from '~/store';
import axios from 'axios';
import { formatDateForInput } from '~/utils/dateHelpers';

const ProfileSettings: React.FC = () => {
    const localize = useLocalize();
    const { user, setUser } = useAuthContext();
    const { showToast } = useToastContext();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        inactiveAt: '',
    });

    useEffect(() => {
        if (user && isDialogOpen) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                password: '',
                confirmPassword: '',
                inactiveAt: formatDateForInput(user.inactiveAt),
            });
        }
    }, [user, isDialogOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            showToast({ message: localize('com_auth_password_not_match'), status: 'error' });
            return;
        }

        try {
            const payload: Record<string, string> = {
                name: formData.name,
                username: formData.username,
            };
            if (formData.password) {
                payload.password = formData.password;
            }

            if (formData.inactiveAt) {
                payload.inactiveAt = new Date(formData.inactiveAt).toISOString();
            } else {
                payload.inactiveAt = null;
            }

            const response = await axios.post('/api/user/update', payload);
            setUser(response.data.user);
            showToast({ message: localize('com_ui_profile_update_success'), status: 'success' });
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;
            showToast({
                message: `(${status || 'N/A'}) ${serverMessage || localize('com_ui_profile_update_error')}`,
                status: 'error'
            });
        }
    };

    return (
        <OGDialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Label className="font-light">{localize('com_ui_profile_settings')}</Label>
                </div>
                <OGDialogTrigger asChild>
                    <Button aria-label="Edit Profile" variant="outline">
                        {localize('com_ui_edit')}
                    </Button>
                </OGDialogTrigger>
            </div>

            <OGDialogContent className="w-11/12 max-w-lg">
                <OGDialogTitle className="mb-6 text-2xl font-semibold">
                    {localize('com_ui_edit_profile')}
                </OGDialogTitle>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">{localize('com_auth_full_name')}</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="username">{localize('com_auth_username')}</Label>
                        <Input
                            id="username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="createdAt">{localize('com_ui_registration_date')}</Label>
                        <Input
                            id="createdAt"
                            type="text"
                            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                            disabled
                            className="mt-1 bg-gray-100 dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <Label htmlFor="inactiveAt">{localize('com_ui_inactivation_date')}</Label>
                        <Input
                            id="inactiveAt"
                            type="date"
                            name="inactiveAt"
                            value={formData.inactiveAt}
                            onChange={handleChange}
                            className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.inactiveAt
                                ? localize('com_ui_account_will_deactivate') + ' ' + new Date(formData.inactiveAt).toLocaleDateString()
                                : localize('com_ui_account_active_indefinitely')}
                        </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <h4 className="text-sm font-medium mb-3">{localize('com_ui_change_password')}</h4>
                        <div className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="password">{localize('com_ui_new_password_optional')}</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={localize('com_ui_leave_blank_keep_current')}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {formData.password && (
                                <div className="relative">
                                    <Label htmlFor="confirmPassword">{localize('com_auth_password_confirm')}</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDialogOpen(false)}
                        >
                            {localize('com_ui_cancel')}
                        </Button>
                        <Button type="submit">
                            {localize('com_ui_save_changes')}
                        </Button>
                    </div>
                </form>
            </OGDialogContent>
        </OGDialog>
    );
};

export default ProfileSettings;
