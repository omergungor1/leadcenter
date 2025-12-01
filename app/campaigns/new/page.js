import { Suspense } from 'react';
import CreateCampaign from '../../../components/pages/CreateCampaign';

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<div className="p-6">Loading...</div>}>
            <CreateCampaign />
        </Suspense>
    );
}

