// app/components/rosca/AddDepositModal.tsx
"use client";

import React, { useState } from 'react';
import { Rosca } from '@/app/lib/types';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

interface AddDepositModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    rosca: Rosca | null; // Pass the whole rosca for context
    actionLoading: boolean;
    onConfirmDeposit: (amount: number) => Promise<void>; // Specific callback
}

export default function AddDepositModal({
    isOpen,
    onOpenChange,
    rosca,
    actionLoading,
    onConfirmDeposit,
}: AddDepositModalProps) {
    const [depositAmount, setDepositAmount] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setError(null);
        const amount = parseInt(depositAmount) * 1_000_000;
        if (!isNaN(amount) && amount > 0) {
            await onConfirmDeposit(amount);
            // Parent component handles closing and resetting input via the promise result
        } else {
            setError("Please enter a valid positive amount.");
        }
    };

     // Reset amount when modal opens or closes
     React.useEffect(() => {
        if (!isOpen) {
            setDepositAmount('');
            setError(null);
        }
     }, [isOpen]);

    if (!rosca) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
            <ModalContent>
                {(onClose) => ( // Use onClose from ModalContent
                    <>
                        <ModalHeader className="flex flex-col gap-1">Add Security Deposit</ModalHeader>
                        <ModalBody>
                            <p className="text-sm text-default-600">
                                Increase your security deposit for ROSCA: <span className="font-medium">{rosca.name}</span> (ID: {rosca.roscaId}).
                            </p>
                            <Input
                                autoFocus
                                label="Deposit Amount"
                                placeholder="Enter amount"
                                type="number"
                                variant="bordered"
                                value={depositAmount}
                                onValueChange={setDepositAmount}
                                min={1}
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">$</span> {/* Or asset symbol */}
                                    </div>
                                }
                                isInvalid={!!error}
                                errorMessage={error}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleConfirm}
                                isLoading={actionLoading}
                                isDisabled={!depositAmount || parseInt(depositAmount) <= 0}
                            >
                                Confirm Deposit
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}