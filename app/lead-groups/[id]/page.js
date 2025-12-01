import LeadGroupDetail from '../../../components/pages/LeadGroupDetail';

export default async function LeadGroupDetailPage({ params }) {
    const { id } = await params;
    return <LeadGroupDetail id={id} />;
}

