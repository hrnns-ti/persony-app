import ProjectsSection from '../components/workspace/ProjectSection';
import { CoursesSection } from "../components/workspace/CourseSection.tsx";
import CertificatesSection from "../components/workspace/CertificateSection";

export default function WorkspacePage() {
    return (
        <main className="flex-1 bg-main overflow-hidden flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto overflow-hidden">
                <div className="grid grid-cols-[75%,25%] gap-4 h-full">
                    <div className="grid grid-rows-[23%,25.5%,48.4%] gap-4 h-full min-h-0">
                        <div className="flex flex-col overflow-hidden">
                            <CoursesSection />
                        </div>

                        <div className="flex flex-col overflow-hidden">
                            <ProjectsSection />
                        </div>

                        <div className="flex flex-col overflow-hidden">
                            <CertificatesSection />
                        </div>
                    </div>

                    {/* Right column reserved (Notes / Assignments nanti) */}
                    <div className="bg-main border border-line rounded-md p-4 text-slate-500 text-xs">
                        Right sidebar (coming soon)
                    </div>
                </div>
            </div>
        </main>
    );
}
