import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
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

const ProfileSettings: React.FC = () => {
    const localize = useLocalize();
    const { user, setUser } = useAuthContext();
    const { showToast } = useToastContext();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user && isDialogOpen) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                password: '',
                confirmPassword: '',
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

            const response = await axios.post('/api/user/update', payload);
            setUser(response.data.user);
            showToast({ message: localize('com_ui_profile_update_success'), status: 'success' });
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showToast({
                message: error.response?.data?.message || localize('com_ui_profile_update_error'),
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

                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <h4 className="text-sm font-medium mb-3">{localize('com_ui_change_password')}</h4>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="password">{localize('com_ui_new_password_optional')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={localize('com_ui_leave_blank_keep_current')}
                                    className="mt-1"
                                />
                            </div>
                            {formData.password && (
                                <div>
                                    <Label htmlFor="confirmPassword">{localize('com_auth_password_confirm')}</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="mt-1"
                                    />
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
