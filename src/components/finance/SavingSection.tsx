import Card from '../ui/Card';

export default function SavingsSection() {
    return (
        <Card className="bg-slate-900 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-6">Savings</h3>

            <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                <div className="text-center text-slate-500">
                    <p>All savings will here, include create saving</p>
                </div>
            </div>
        </Card>
    );
}
