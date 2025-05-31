// app/components/rosca/CreateRoscaForm.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Switch } from '@heroui/switch';
import { Select, SelectItem } from '@heroui/select';
import { DatePicker } from '@heroui/date-picker';
import { NumberInput } from '@heroui/number-input';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import {
    getLocalTimeZone,
    today,
    DateValue
} from "@internationalized/date";
import { I18nProvider } from '@react-aria/i18n';
import { Key } from '@react-types/shared';
import { addToast } from '@heroui/toast';

// Define frequency options
const frequencyOptions = [
    { key: '604800000', label: 'Weekly' },
    { key: '1209600000', label: 'Bi-Weekly' },
    { key: '2592000000', label: 'Monthly' },
];

// Props interface
interface CreateRoscaFormProps {
    onSubmitAction: (payload: any) => Promise<{ success: boolean; error?: string, roscaId?: number }>;
    currentUserAddress: string;
}

export default function CreateRoscaForm({ onSubmitAction, currentUserAddress }: CreateRoscaFormProps) {
    // State - removed totalParticipants from direct state management
    const [formData, setFormData] = useState({
        name: '',
        contributionAmount: '',
        contributionFrequency: frequencyOptions[0].key,
        startByTimestamp: today(getLocalTimeZone()).add({ days: 1 }) as DateValue | null,
        minParticipants: '',
        randomOrder: false,
        invitedParticipants: [] as string[],
        paymentAsset: 'USDT'
    });
    const [newInvite, setNewInvite] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
     };
    
    //  const handleSelectChange = (name: string) => (key: Key | Set<Key>) => {
    //      const value = typeof key === 'string' || typeof key === 'number' ? String(key) : ''; // Handle single selection key
    //     setFormData(prev => ({ ...prev, [name]: value }));
    // };
    
     const handleSwitchChange = (isSelected: boolean) => {
        setFormData(prev => ({ ...prev, randomOrder: isSelected }));
    };
    
    const handleDateChange = (date: DateValue | null) => {
        setFormData(prev => ({ ...prev, startByTimestamp: date }));
    };
    
     const handleNumberChange = (name: string) => (value: number | string) => {
         // Ensure value is treated as string for state, validation can parse later
        setFormData(prev => ({...prev, [name]: String(value)}));
     };
    
    const handleAddInvite = () => {
        const inviteTrimmed = newInvite.trim();
         // Basic validation: not empty, not self, not already added
        if (inviteTrimmed && inviteTrimmed !== currentUserAddress && !formData.invitedParticipants.includes(inviteTrimmed)) {
            // Add more robust address validation here if needed
            setFormData(prev => ({
                ...prev,
                invitedParticipants: [...prev.invitedParticipants, inviteTrimmed]
            }));
            setNewInvite('');
        } else if (inviteTrimmed === currentUserAddress) {
            setFormError("You cannot invite yourself.");
        } else if (formData.invitedParticipants.includes(inviteTrimmed)) {
             setFormError("Participant already invited.");
        } else {
            setFormError("Please enter a valid participant address to invite.");
        }
    };
    
    const handleRemoveInvite = (inviteToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            invitedParticipants: prev.invitedParticipants.filter(invite => invite !== inviteToRemove)
        }));
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError(null);

        // --- Calculate Total Participants ---
        const calculatedTotalParticipants = formData.invitedParticipants.length + 1; // +1 for the creator

        // --- Validation ---
        // Removed direct check for formData.totalParticipants
        if (!formData.name || !formData.contributionAmount || !formData.startByTimestamp || !formData.minParticipants) {
            setFormError("Please fill in all required fields."); setIsLoading(false); return;
        }
        const minP = parseInt(formData.minParticipants);
         // Validate calculated total against min
        if (isNaN(minP) || minP <= 1 || calculatedTotalParticipants < minP) {
             setFormError(`Minimum participants (${minP}) cannot exceed the total calculated participants (${calculatedTotalParticipants}) based on invites, and must be > 1.`); setIsLoading(false); return;
        }
        // Validation for contribution amount and date remains the same
        const contribAmountNum = parseInt(formData.contributionAmount);
        if (isNaN(contribAmountNum) || contribAmountNum <= 0) {
            setFormError("Contribution Amount must be a positive number."); setIsLoading(false); return;
        }
        if (!formData.startByTimestamp || formData.startByTimestamp.compare(today(getLocalTimeZone())) <= 0) {
            setFormError("Target Start Date must be in the future."); setIsLoading(false); return;
         }


        // --- Payload Preparation ---
        const startTimestampDate = formData.startByTimestamp
            ? formData.startByTimestamp.toDate(getLocalTimeZone())
            : null;
        const startTimestampEpochSeconds = startTimestampDate
            ? BigInt(Math.floor(startTimestampDate.getTime()))
            : BigInt(0);

        if (startTimestampEpochSeconds === BigInt(0)) { /* ... */ }

        const payload = {
            name: formData.name,
            randomOrder: formData.randomOrder,
            minimumParticipantThreshold: minP,
            contributionAmount: contribAmountNum,
            paymentAsset: formData.paymentAsset,
            contributionFrequency: BigInt(formData.contributionFrequency),
            startByTimestamp: startTimestampEpochSeconds,
            invitedPreVerifiedParticipants: formData.invitedParticipants,
        };

        // --- Submission ---
        try {
            const result = await onSubmitAction(payload);
             // ... handle result ...
             if (result.success) { addToast({
                title: "Circle successfully created!",
              }); }
             else { setFormError(result.error || "Failed to create Circle."); }
        } catch (error) { /* ... handle error */ }
        finally { setIsLoading(false); }
    };

     // --- Render ---
    return (
         <I18nProvider locale="en-GB">
             <Card>
                 <form onSubmit={handleSubmit}>
                     <CardHeader>
                         <h2 className="text-xl font-semibold">New Circle Details</h2>
                     </CardHeader>
                     <CardBody className="gap-4">
                        {/* ROSCA Name */}
                         <Input isRequired label="Circle Name" name="name" placeholder="E.g., Monthly Savings Club" value={formData.name} onChange={handleInputChange} />

                         {/* Contribution & Frequency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <NumberInput isRequired label="Contribution Amount" name="contributionAmount" placeholder="0" min={1} value={formData.contributionAmount === '' ? undefined : Number(formData.contributionAmount)} onValueChange={handleNumberChange('contributionAmount')} description="Amount each member contributes per round."/>
                             <Select
                                selectionMode="single"
                                isRequired
                                label="Contribution Frequency"
                                selectedKeys={new Set([formData.contributionFrequency])}
                                onSelectionChange={(keys) => {
                                    const key = Array.from(keys)[0] as string;
                                    setFormData(prev => ({
                                    ...prev,
                                    contributionFrequency: key
                                    }));
                                }}
                                >
                                {frequencyOptions.map(freq => (
                                    <SelectItem key={freq.key}>
                                    {freq.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                         {/* Start Date */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NumberInput
                                    isRequired
                                    label="Min Participants to Start"
                                    name="minParticipants"
                                    placeholder="e.g., 5"
                                    min={2}
                                    value={formData.minParticipants === '' ? undefined : Number(formData.minParticipants)}
                                    onValueChange={handleNumberChange('minParticipants')}
                                    description="Minimum members needed before starting."
                                />
                            <DatePicker isRequired label="Start By Date" name="startByTimestamp" value={formData.startByTimestamp} onChange={handleDateChange} minValue={today(getLocalTimeZone()).add({ days: 1 })} showMonthAndYearPickers description="The date by which the Circle must be started."/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            selectionMode="single"
                            isRequired
                            label="Payment Asset"
                            selectedKeys={new Set([formData.paymentAsset])}
                            onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0] as string;
                                setFormData(prev => ({
                                ...prev,
                                paymentAsset: key
                                }));
                            }}
                            >
                            <SelectItem key="USDT">USDT</SelectItem>
                            <SelectItem key="USDC">USDC</SelectItem>
                        </Select>
                        </div>

                        <Divider className="my-2"/>

                        {/* --- Invites Section --- */}
                         <div>
                            <label className="block text-sm font-medium text-foreground-600 mb-1">Invite Participants (Address)</label>
                             <p className="text-xs text-default-500 mb-2">
                                 Add participant addresses below. The total number of participants will be the number of invitees plus yourself (the creator).
                             </p>
                            <div className="flex gap-2">
                                <Input label="Participant Address" labelPlacement='inside' placeholder="Enter address..." value={newInvite} onValueChange={setNewInvite} className="flex-grow" />
                                <Button type="button" onPress={handleAddInvite} variant='flat'>Add</Button>
                            </div>
                             <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]"> {/* Ensure min-height */}
                                 {formData.invitedParticipants.map((invite) => (
                                    <Chip key={invite} onClose={() => handleRemoveInvite(invite)} size="sm">
                                         {invite.length > 10 ? `${invite.substring(0, 6)}...${invite.substring(invite.length - 4)}` : invite}
                                    </Chip>
                                ))}
                            </div>
                         </div>
                     </CardBody>
                     <CardFooter className="flex flex-col items-start gap-2">
                         {formError && <p className="text-danger text-sm">{formError}</p>}
                          <Button type="submit" color="primary" isLoading={isLoading} fullWidth>Create ROSCA</Button>
                     </CardFooter>
                 </form>
             </Card>
         </I18nProvider>
    );
}