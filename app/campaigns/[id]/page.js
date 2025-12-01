import CampaignDetail from '../../../components/pages/CampaignDetail';

export default async function CampaignDetailPage({ params }) {
    const { id } = await params;
    return <CampaignDetail id={id} />;
}

