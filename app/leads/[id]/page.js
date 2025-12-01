import LeadDetail from '../../../components/pages/LeadDetail';

export default async function LeadDetailPage({ params }) {
    const { id } = await params;
    return <LeadDetail id={id} />;
}

