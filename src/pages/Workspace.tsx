import ProjectsSection from '../components/workspace/ProjectSection';

export default function WorkspacePage() {
    return (
        <main className="flex-1 bg-main overflow-hidden flex flex-col">
        <div className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-3 gap-6 h-full">
            {/* Col 1: Courses + Assignments */}
            <div className="flex flex-col gap-4">
        {/* TODO: CoursesSection, AssignmentsSection */}
        </div>

    {/* Col 2: Projects */}
    <ProjectsSection />

    {/* Col 3: Notes / Certificates */}
    <div className="flex flex-col gap-4">
        {/* TODO: NotesSection, CertificatesSection */}
        </div>
        </div>
        </div>
        </main>
);
}
